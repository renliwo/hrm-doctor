#!/usr/bin/env node

const program = require("commander");
const request = require("request");
const cheerio = require("cheerio");

// init
program
  .version(require("../package.json").version)
  .usage("[project name] [options] ")
  .option("-e, --env <str>", "specify env, check all if not set explicitly")
  .parse(process.argv);

// collect args
var deploy_env = program.args[0];
var env = program.env;

function checkArgs(env) {
  if (!env) return true;
  return ["daily", "pro", "pre"].indexOf(env) !== -1;
}

function isSource(link) {
  return link.match(/index/);
}
let i = 0;
function checkVersion(link) {
  // console.log("checking version");
  console.log(`version is ${i++}`);
  return "1.0.1";
}

function checkLastUpdateTime(source) {
  // console.log("checking cache");
  console.log(`lut is ${i++}`);
}

function analyse(env) {
  request("http://localhost:8000", function(error, response, body) {
    // console.log("error:", error); // Print the error if one occurred
    // console.log("statusCode:", response && response.statusCode); // Print the response status code if a response was received
    // console.log("body:", body); // Print the HTML for the Google homepage.
    const $ = cheerio.load(body);

    $("script[src]").map(function(index, ele) {
      const link = $(this).attr("src");
      if (isSource(link)) {
        request("http://localhost:8000/index.js", function(
          error,
          response,
          body
        ) {
          console.log(`------start checking ${env} -------`);
          checkVersion(link);
          checkLastUpdateTime(body);
        });
      }
    });
  });
}

const urlMapper = {
  daily:
    "http://daily-hrmregister.dingtalk.com:7001/hrmregister/hrm/index?corpId=123455#"
};

if (checkArgs(env)) {
  env ? [env] : ["daily", "pro", "pre"].map(env => analyse(env));
} else {
  console.error(`参数不合法， 环境只支持daily，pre， pro, 并不支持${env}哦`);
}
