#!/usr/bin/env node

const program = require("commander");
const request = require("request");
const cheerio = require("cheerio");
const md5 = require("js-md5");
const R = require("ramda");
const fetch = require("isomorphic-fetch");

// init
program
  .version(require("../package.json").version)
  .usage("[project name] [options] ")
  .option("-e, --env <str>", "specify env, check all if not set explicitly")
  .parse(process.argv);

// collect args
var env = program.args[0];

function checkArgs(env) {
  if (!env) return true;
  return ["daily", "pro", "pre"].indexOf(env) !== -1;
}

function isSource(link) {
  return link.match(/react-hrm-h5/);
}

function checkVersion(link) {
  console.log(`version is ${link.match(/\d\.\d\.\d/)[0]}`);
}

function checkMD5(source) {
  // console.log("checking cache");
  console.log(`md5 is ${md5(source)}`);
}
function showRefresh(fresh) {
  return console.info(`当前环境代码${fresh ? "" : "不"}是最新的`);
}

function compareMD5(files) {
  if (!files.length) return;
  if (!files[0] || !files[1]) return;
  return files[0] === files[1];
}

function getJSFile(url) {
  return fetch(url).then(res => res.text());
}

function getUrlByEnv(env) {
  return {
    daily:
      "http://daily-hrmregister.dingtalk.com:7001/hrmregister/mobile/index?corpId=123455#",
    pre:
      "https://pre-hrmregister.dingtalk.com/hrmregister/mobile/index?corpId=123455#/"
  }[env];
}

async function checkFresh(repo, cdn, cb) {
  const files = await Promise.all(R.map(getJSFile)([repo, cdn]));
  cb();
  return R.pipe(compareMD5, showRefresh)(files);
}

function analyse(env) {
  if (env === "pro") {
    console.info("对不起，暂时不支持生产环境\n---- skiping pro");
    return -1;
  }
  request(getUrlByEnv(env), function(error, response, body) {
    if (error) {
      console.error("谁又在发版？");
      return -1;
    }
    const $ = cheerio.load(body);

    $("script[src]").map(function(index, ele) {
      const link = $(this).attr("src");

      if (isSource(link)) {
        request(link, function(error, response, body) {
          checkFresh(
            "http://gitlab.alibaba-inc.com/dingding/react-hrm-h5/blob/daily/0.4.1/dist/index.js",
            link,
            () => {
              console.log(`------start checking ${env} -------`);
              checkVersion(link);
              checkMD5(body);
            }
          );
        });
      }
    });
  });
}

if (checkArgs(env)) {
  (env ? [env] : ["daily", "pro", "pre"]).map(env => analyse(env));
} else {
  console.error(`参数不合法， 环境只支持daily，pre， pro, 并不支持${env}哦`);
}
