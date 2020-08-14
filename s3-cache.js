// @ts-check
const AWS = require("aws-sdk");

const objectPrefix = process.env.S3_PREFIX_KEY || "prerender";
const bucketName = process.env.S3_BUCKET_NAME;
const endpoint = process.env.AWS_ENDPOINT;

const s3 = new AWS.S3({
  endpoint,
  params: {
    Bucket: bucketName,
  },
});

module.exports = function s3Cache() {
  const expirationDays = parseInt(process.env.S3_EXPIRATION_DAYS, 10) || 7;
  const lifecycleRuleId = `prerender-expiration-rule-prefix_${objectPrefix}`;
  /**
   * @type AWS.S3.LifecycleRule
   */
  const newRule = {
    Expiration: { Days: expirationDays },
    Filter: { Prefix: `${objectPrefix}/` },
    ID: lifecycleRuleId,
    Status: "Enabled",
  };
  // Configure lifecycle on load
  s3.getBucketLifecycleConfiguration((getErr, data) => {
    if (getErr) {
      console.error(getErr, getErr.stack);
    } else {
      const Rules = (data.Rules ? data.Rules : []).filter(
        (rule) => rule.ID !== newRule.ID
      );
      Rules.push(newRule);
      s3.putBucketLifecycleConfiguration(
        { Bucket: bucketName, LifecycleConfiguration: { Rules } },
        (putErr) => {
          if (putErr) {
            console.error(putErr, putErr.stack);
          } else {
            console.log(`${bucketName} lifecycle rules updated`);
          }
        }
      );
    }
  });

  return {
    requestReceived: function (req, res, next) {
      if (req.method !== "GET") {
        return next();
      }

      var key = req.prerender.url;

      if (objectPrefix) {
        key = objectPrefix + "/" + key;
      }

      s3.getObject(
        {
          Bucket: bucketName,
          Key: key,
        },
        function (err, result) {
          if (!err && result) {
            return res.send(200, result.Body);
          }

          next();
        }
      );
    },

    pageLoaded: function (req, res, next) {
      if (req.prerender.statusCode !== 200) {
        return next();
      }

      var key = req.prerender.url;

      if (objectPrefix) {
        key = objectPrefix + "/" + key;
      }

      s3.putObject(
        {
          Bucket: bucketName,
          Key: key,
          ContentType: "text/html;charset=UTF-8",
          StorageClass: "REDUCED_REDUNDANCY",
          Body: req.prerender.content,
        },
        function (err, result) {
          if (err) console.error(err);

          next();
        }
      );
    },
  };
};
