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
  console.log(
    `[Prerender S3 Cache] Configuring ${expirationDays} day expiration on '${objectPrefix}' keys`
  );
  s3.getBucketLifecycleConfiguration((getErr, data) => {
    if (getErr) {
      if (getErr.code !== "NoSuchLifecycleConfiguration") {
        console.error("[Prerender S3 Cache]", getErr, getErr.stack);
        return;
      }
    }
    const Rules = (data && data.Rules ? data.Rules : []).filter(
      (rule) => rule.ID !== newRule.ID
    );
    if (Rules.length > 0) {
      console.log(
        `[Prerender S3 Cache] ${Rules.length} lifecycle rules already exist. Updating...`
      );
    }
    Rules.push(newRule);
    s3.putBucketLifecycleConfiguration(
      { Bucket: bucketName, LifecycleConfiguration: { Rules } },
      (putErr) => {
        if (putErr) {
          console.error("[Prerender S3 Cache]", putErr, putErr.stack);
        } else {
          console.log(
            `[Prerender S3 Cache] ${bucketName} lifecycle rules updated.`
          );
        }
      }
    );
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

      console.log(`[Prerender S3 Cache] Getting '${key}'`);
      s3.getObject(
        {
          Bucket: bucketName,
          Key: key,
        },
        function (err, result) {
          if (!err && result) {
            console.log(`[Prerender S3 Cache] Found '${key}'.`);
            return res.send(200, result.Body);
          }
          console.log(`[Prerender S3 Cache] Could not find '${key}'.`);

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

      console.log(`[Prerender S3 Cache] Saving '${key}'.`);
      s3.putObject(
        {
          Bucket: bucketName,
          Key: key,
          ContentType: "text/html;charset=UTF-8",
          StorageClass: "REDUCED_REDUNDANCY",
          Body: req.prerender.content,
        },
        function (err, result) {
          if (err) console.error("[Prerender S3 Cache]", err);

          console.log(`[Prerender S3 Cache] Saved '${key}'.`);

          next();
        }
      );
    },
  };
};
