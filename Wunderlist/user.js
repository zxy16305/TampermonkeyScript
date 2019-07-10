// ==UserScript==
// @name         paste upload image/file
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  try to take over the world!
// @author       You
// @match        https://www.wunderlist.com/webapp
// @grant        none
// @require http://ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min.js
// ==/UserScript==

(function () {
    'use strict';
    console.log("plugin start");
    var run = false;

    Date.prototype.Format = function (fmt) { //author: meizz
        var o = {
            "M+": this.getMonth() + 1, //月份
            "d+": this.getDate(), //日
            "h+": this.getHours(), //小时
            "m+": this.getMinutes(), //分
            "s+": this.getSeconds(), //秒
            "q+": Math.floor((this.getMonth() + 3) / 3), //季度
            "S": this.getMilliseconds() //毫秒
        };
        if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
        for (var k in o) {
            if (new RegExp("(" + k + ")").test(fmt)) {
                fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
            }
        }
        return fmt;
    }

    var falg = setInterval(function () {
        if (run) {
            clearInterval(falg);
            return;
        }
        if (!/#\/tasks*/.test(window.top.location.hash)) return;
        run = true;

        console.log("paste plugin start...");
        var flag2 = setInterval(function () {
            var a = window.top.document.getElementsByClassName("inner")[0];
            if (!a) {
                return
            }
            clearInterval(flag2)

            a.addEventListener('paste', function (event) {
                var matchArray = location.hash.match(/#\/tasks\/(\d+)/);
                if (!matchArray) return;
                var taskId = parseInt(matchArray[1]);

                var items = event.clipboardData && event.clipboardData.items;
                var file = null;
                var fileType = null;
                if (items && items.length) {
                    // 检索剪切板items
                    for (var i = 0; i < items.length; i++) {
                        if (items[i].type.indexOf('image') !== -1) {
                            var tempfile = items[i].getAsFile();
                            var extention = ".png";
                            if (tempfile.name) {
                                var match = tempfile.name.match(/.+(\..+)/);
                                if (match) {
                                    extention = match[1];
                                }
                            }
                            // TODO 名字输入
                            var name = prompt("请输入文件名", "screenshot");
                            var fileName = (name || "screenshot") + "-" + new Date().Format("yyyyMMddhhmmss") + extention;
                            file = new File([tempfile], fileName)
                            fileType = tempfile.type;
                            break;
                        }
                    }
                }
                window.top.files = [file]
                // 此时file就是剪切板中的图片文件
                window.top.require(['application/runtime'], function (runtime) {
                    runtime.sdk.http.uploads.create({
                        content_type: fileType,
                        file_name: file.name,
                        file_size: file.size
                    }).done(function (uploadData) {
                        delete file.type
                        var s = runtime.io.upload(uploadData.part.url, file, {
                            "x-amz-date": uploadData.part.date,
                            Authorization: uploadData.part.authorization,
                            "Content-Type": ""
                        });
                        s.done(function (sendDate) {
                            runtime.sdk.http.uploads.finish(uploadData.id).done(function (finishData) {
                                runtime.sdk.http.files.create({
                                    "upload_id": uploadData.id,
                                    "task_id": taskId,
                                    local_created_at: new Date().toISOString()
                                }).done(function (finalData) {
                                        console.log("文件上传成功")
                                    }
                                )

                            })
                        })
                        s.send();
                    })
                })

                // window.top.require(["wunderbits/views/WBFileSelectorView"], function (view) {
                //     view.prototype.trigger("selected:files", [file])
                // })
            });
        }, 2000)


    }, 2000)


    // Your code here...
})();
