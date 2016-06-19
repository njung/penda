'use strict';
var fs = require('fs');
var readline = require('readline');
var moment = require('moment');
var async = require('async');
/* var csv2json = require('csv-to-json-stream'); */
var babyparse = require('babyparse');
var jstoxml = require('jstoxml');
var spawn = require('child_process').spawn;
/* var streamJson = require("stream-json"); */
var StreamArray = require("stream-json/utils/StreamArray");

var Converter = function() {}
Converter.prototype.csv2json = function(csvPath, jsonPath) {
  var self = this;
  return new Promise(function(resolve, reject) {
    //console.log('csv2json');
    if (!csvPath) {
      csvPath = '/tmp/sample.csv';
    }
    if (!jsonPath) {
      jsonPath = '/tmp/sample.json';
    }
    let header, firstRow, len, totalRows = 0, totalColumns, schema = {};
    fs.appendFileSync(jsonPath + '.tmp', '[');
    var parsed = babyparse.parseFiles(csvPath, {
      dynamicTyping : true,
      step : function(row) {
        try {
          if (row.data && (row.data.length > 0)) {
            if (!row.data[0][0]) {
              return;
            }
            if (row.errors.length > 0) {
              console.error(row.errors);
              process.exit();
            }
            if (!header) {
              header = row.data[0];
              totalColumns = header.length;
              for (var i in header) {
                header[i] = header[i].trim();
              }
              fs.appendFileSync(csvPath.replace('.csv','.valid.csv'), header.join(',') + '\n');
            } else {
              if (row.data[0].length != header.length) {
                console.error('Inconsistent column length');
                process.exit();
              }
              let obj = {};
              totalRows++;
              for (var h in header) {
  
                // Remove whitespace / nbsp
                // TODO Check typeof
                if (row.data[0][h][0] && typeof row.data[0][h][0] == 'string') {
                  row.data[0][h] = row.data[0][h].trim();
                }
                var key = header[h]
                          .replace(/[^A-Za-z0-9]/g,'')
                          .replace(/\//g,'')
                          .replace(/"/g,'')
                          .replace(/'/g, '')
                          .replace(/</g,'')
                          .replace(/>/g,'')
                          .replace(/&/g,'');
                var val = row.data[0][h];
                if (typeof val == 'string') {
                  val = val
                          .replace(/"/g,'')
                          .replace(/'/g, '')
                          .replace(/</g,'&lt;')
                          .replace(/>/g,'&gt;')
                          .replace(/&/g,'&amp;');
                }
                obj[key] = val;
              }
              // Collect type data on the first row
              if (!firstRow) {
                firstRow = true;
                var keys = Object.keys(obj);
                for (var i in keys) {
                  schema[keys[i]] = typeof obj[keys[i]];
                  // Detect Date ISO string 2016-06-19T06:46:50.747Z
                  if (typeof obj[keys[i]] == 'string' && 
                  obj[keys[i]].length == 24 && 
                  obj[keys[i]][4] == '-' &&
                  obj[keys[i]][7] == '-' &&
                  obj[keys[i]][10] == 'T' &&
                  obj[keys[i]][13] == ':' &&
                  obj[keys[i]][16] == ':') {
                    schema[keys[i]] = 'date';
                  }
                }
              }
              fs.appendFileSync(jsonPath + '.tmp', JSON.stringify(obj) + ',');
              for (var i in row.data[0]) {
                if (typeof row.data[0][i] == 'string' && row.data[0][i].indexOf(',') > -1) {
                  row.data[0][i] = '\"' + row.data[0][i] + '\"'; 
                }
              }
              fs.appendFileSync(csvPath.replace('.csv','.valid.csv'), row.data[0].join(',') + '\n');
            }
          }
        } catch (e) {
          console.error(e);
          process.exit();
        }
      },
      complete : function(){
        //console.log('complete');
        var cmd = spawn('sed', ['$ s/.$//', jsonPath + '.tmp']);
        var s = cmd.stdout.pipe(fs.createWriteStream(jsonPath));
        s.on('finish', function(){
          fs.appendFileSync(jsonPath, ']');
          spawn('rm', ['-f', jsonPath + '.tmp']);
          //console.log('done : ' + jsonPath);
          return resolve({
            totalRows : totalRows,
            totalColumns : totalColumns,
            schema : schema,
          });
        });
        s.on('error', function(err) {
          console.log(err);
          return reject(err);
        })
        cmd.stdout.on('error', function(err){
          console.log(err);
          return reject(err);
        });
      }
    });
  });
}

Converter.prototype.json2xml = function(jsonPath, xmlPath) {
  var self = this;
  return new Promise(function(resolve, reject) {
    //console.log('json2xml');
    fs.appendFileSync(xmlPath, '<?xml version="1.0"?>\n');
    fs.appendFileSync(xmlPath, '<!DOCTYPE record>\n');
    fs.appendFileSync(xmlPath, '<dataset>\n');
    var stream = StreamArray.make();
    stream.output.on("data", function(object){
      fs.appendFileSync(xmlPath, '<record>' + jstoxml.toXML(object.value) + '</record>\n');
    });
    stream.output.on("end", function(){
      fs.appendFileSync(xmlPath, '</dataset>\n');
      //console.log('done : ' + xmlPath);
      resolve();
    });
    fs.createReadStream(jsonPath).pipe(stream.input);
  })
}
Converter.prototype.csv2xlsx = function(jsonPath, xlsxPath) {
  var self = this;
  return new Promise(function(resolve, reject) {
    //console.log('csv2xlsx');
    var cmd = spawn('node_modules/.bin/j', ['-f', jsonPath, '-X', '-o', xlsxPath]);
    cmd.stdout.on('error', function(err) {
      console.log(err.toString());
      reject();
    })
    cmd.stdout.on('finish', function() {
      //console.log('done : ' + xlsxPath);
      resolve();
    })
  })
}

// Check for parent
if (!module.parent) {
  var converter = new Converter();
  var path = process.argv[2];
  var result;
  //console.log(path); 
  // Convert them all
  // CSV --> JSON
  converter.csv2json(path, path.replace('.csv', '.valid.json'))
  .then(function(res){
    result = res;
  // JSON --> XLSX
    return converter.csv2xlsx(path, path.replace('.csv', '.valid.xlsx'));
  })
  .then(function(){
  // JSON --> XML
    return converter.json2xml(path.replace('.csv', '.valid.json'), path.replace('.csv', '.valid.xml'))
  })
  .then(function(){
    //console.log('convert sequence done');
    console.log(JSON.stringify(result));
  })
  .catch(function(err){
    console.log('An error occured');
    console.error(err);
    proccess.exit(0);
  })
}
