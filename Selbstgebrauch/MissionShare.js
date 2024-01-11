! function() {
    "use strict";
    $("body").prepend('\n<div id="shMiModal" style="display: none;" class="modal fade">    <div role="document" class="modal-dialog" style="width: fit-content">        <div class="modal-content">            \x3c!-- Header --\x3e            <div class="modal-header">                <h3>                    <center>Einsätze teilen</center>                </h3>            </div>            \x3c!-- Content --\x3e            <br>            <table style="width: 90%; margin-left: 10px; margin-right: 10px" id="shMiSettingsV2">                <style>                    body.dark tr {                        background-color: #505050;                    }                    .progress {                        margin-bottom: 0px;                    }                    td {                        padding: 2px;                    }                    .shMiMessage {                        width: 21ch;                        font: 11pt monospace;                    }                    .btn-shMiMessageRemove {                        font: 11pt monospace;                    }                    .btn-shMiMessageAdd {                        font: 11pt monospace;                    }                </style>                <tr>                    <td>                        <h4>Einstellungen</h4>                    </td>                </tr>                <tr title="Einsätze ab dieser Grenze werden freigegeben">                    <td>                        <strong>                            Credits:                        </strong>                    </td>                    <td></td>                    <td>                        <input type="number" id="shMiCredits" class="form-control" oninput="if (this.validity.badInput) this.value = \'\'">                    </td>                    <td></td>                </tr>\x3c!--                    <tr class="shMiMessageRow">                    <td>                        <strong>                            Nachricht:                        </strong>                    </td>                    <td>                        <input class="shMiMessageSelect" type="radio" name="shMiReplySelect">                    </td>                    <td>                        <input id="shMiMessage" class="shMiMessage form-control">                    </td>                    <td>                        <div class="btn btn-danger btn-xs btn-shMiMessageRemove">-</div>                    </td>                </tr> --\x3e                <tr class="shMiAddRowRow">                    <td colspan="3"></td>                    <td>                        <div class="btn btn-success btn-xs btn-shMiMessageAdd">+</div>                    </td>                </tr>                <tr>                    <td>                        <h4>Status</h4>                    </td>                </tr>                \x3c!-- <tr><td><a id="shMiShare" class="btn btn-xs btn-default">Einsätze freigeben</a></td></tr> --\x3e                <tr>                    <td colspan="2">                        <strong>                            Initialisieren:                        </strong>                    </td>                    <td>                        <div class="progress">                            <div class="progress-bar bg-success" role="progressbar" style="width: 0%" aria-valuenow="0"                                aria-valuemin="0" aria-valuemax="100" id="shMiPrgsInitialize"></div>                        </div>                    </td>                </tr>                <tr>                    <td colspan="2">                        <strong>                            Teilen:                        </strong>                    </td>                    <td>                        <div class="progress">                            <div class="progress-bar bg-success" role="progressbar" style="width: 0%" aria-valuenow="0"                                aria-valuemin="0" aria-valuemax="100" id="shMiPrgsShare"></div>                        </div>                    </td>                </tr>                <tr>                    <td colspan="2">                        <strong>                            Rückmeldung:                        </strong>                    </td>                    <td>                        <div class="progress">                            <div class="progress-bar bg-success" role="progressbar" style="width: 0%" aria-valuenow="0"                                aria-valuemin="0" aria-valuemax="100" id="shMiPrgsMessage"></div>                        </div>                    </td>                </tr>            </table>            <br>            \x3c!-- Footer --\x3e            <div class="modal-footer">                <button type="button" id="shMiShare" class="btn btn-success">Freigeben</button>                <button type="button" class="btn btn-danger" data-dismiss="modal">Schließen</button>            </div>        </div>    </div></div>\n    '), $("a#mission_select_sicherheitswache").parent().after('<a class="btn btn-xs btn-default" data-toggle="modal" data-target="#shMiModal" id="shMiOpenModal">Einsätze freigeben</a>');
    var e = new Array;
    const t = new FormData;

    function s() {
        var e = 0;
        const t = document.querySelectorAll(".shMiMessage");
        t.forEach((t => {
            const s = t.value.length + 4;
            e = Math.max(e, s)
        }));
        const s = Math.min(Math.max(e, 25), 128);
        t.forEach((e => {
            e.style.width = s + "ch"
        }))
    }

    function a(e = !1, t = "") {
        $(".shMiAddRowRow").before(`\n        <tr class="shMiMessageRow">\n            <td></td>\n            <td>\n                <input class="shMiMessageSelect" type="radio" name="shMiReplySelect" ${e?'checked="checked"':""}>\n            </td>\n            <td>\n                <input id="shMiMessage" class="shMiMessage form-control" value="${t}" title="Freilassen um keine Nachricht zu senden">\n            </td>\n            <td>\n                <div class="btn btn-danger btn-xs btn-shMiMessageRemove">-</div>\n            </td>\n        </tr>\n        `), $(".shMiMessageRow:first td:first")[0].innerHTML = "<strong>Nachricht:</strong>", s(), i(), $(".shMiMessageRow").length >= 10 && $(".btn-shMiMessageAdd").addClass("hidden")
    }

    function i() {
        const e = [];
        document.querySelectorAll(".shMiMessageRow").forEach((t => {
            const s = t.querySelector(".shMiMessageSelect").checked,
                a = t.querySelector(".shMiMessage").value;
            e.push({
                c: s,
                m: a
            })
        })), localStorage.setItem("shMiSettingsV2", JSON.stringify({
            credits: $("#shMiCredits")[0].value,
            messages: e
        }))
    }
    async function n() {
        (!localStorage.aMissions || JSON.parse(localStorage.aMissions).lastUpdate < (new Date).getTime() - 3e5) && await $.getJSON("/einsaetze.json").done((e => localStorage.setItem("aMissions", JSON.stringify({
            lastUpdate: (new Date).getTime(),
            value: e
        })))), localStorage.setItem("shMiType", JSON.stringify({
            type: Array.from(JSON.parse(localStorage.aMissions).value).filter((e => e.average_credits >= $("#shMiCredits")[0].value)).map((({
                id: e
            }) => e))
        }))
    }
    async function r() {
        var e = JSON.parse(localStorage.getItem("shMiType")).type;
        return Array.from($("#mission_list div.panel-default:not(.panel-success,.mission_panel_green)").parent()).filter((t => {
            var s = $(t).attr("mission_type_id");
            return "null" != $(t).attr("data-overlay-index") && "" != $(t).attr("data-overlay-index") && (s = s + "-" + $(t).attr("data-overlay-index")), "null" != $(t).attr("data-additive-overlays") && "" != $(t).attr("data-additive-overlays") && (s = s + "/" + $(t).attr("data-additive-overlays")), e.includes(s)
        }))
    }!async function() {
        localStorage.shMiSettings && !localStorage.shMiSettingsV2 && (localStorage.setItem("shMiSettingsV2", JSON.stringify({
            credits: JSON.parse(localStorage.shMiSettings).credits,
            messages: [{
                c: !0,
                m: JSON.parse(localStorage.shMiSettings).message
            }]
        })), localStorage.removeItem("shMiSettings")), localStorage.shMiSettingsV2 || localStorage.setItem("shMiSettingsV2", JSON.stringify({
            credits: 0,
            messages: [{
                c: !0,
                m: ""
            }]
        }));
        const e = JSON.parse(localStorage.shMiSettingsV2);
        $("#shMiCredits")[0].value = e.credits, e.messages.forEach((e => {
            a(e.c, e.m)
        }))
    }(), $("body").on("shown.bs.modal", "#shMiModal", (async function() {
        await n(), e = await r()
    })), $("body").on("change", "#shMiCredits", (function() {
        n(), i()
    })), $("body").on("change", "#shMiMessage", (function() {
        i()
    })), $("body").on("click", ".shMiMessageSelect", (function() {
        i()
    })), $("body").on("input", ".shMiMessage", (function() {
        s()
    })), $("body").on("click", ".btn-shMiMessageAdd", (function() {
        a()
    })), $("body").on("click", ".btn-shMiMessageRemove", (function() {
        ! function(e) {
            $(".shMiMessageRow").length > 1 ? $(e).closest("tr").remove() : e.value = "";
            $(".shMiMessageRow:first td:first")[0].innerHTML = "<strong>Nachricht:</strong>", $(".shMiMessageSelect:checked").length || $(".shMiMessageSelect:first").prop("checked", "checked");
            $(".btn-shMiMessageAdd").removeClass("hidden"), s(), i()
        }(this)
    })), $("body").on("click", "#shMiShare", (async function() {
        this.setAttribute("disabled", "disabled"), e = await r(), $("#shMiPrgsInitialize").attr("aria-valuemax", e.length).css({
            width: "0%"
        }).text("0 / " + e.length.toLocaleString()), $("#shMiPrgsShare").attr("aria-valuemax", e.length).css({
            width: "0%"
        }).text("0 / " + e.length.toLocaleString()), $("#shMiPrgsMessage").attr("aria-valuemax", e.length).css({
            width: "0%"
        }).text("0 / " + e.length.toLocaleString()), await async function(e) {
            t.set("utf8", "✓"), t.set("authenticity_token", $('meta[name="csrf-token"]').attr("content")), t.set("mission_reply[alliance_chat]", "0"), t.set("mission_reply[content]", $(".shMiMessageRow:has(.shMiMessageSelect:checked) .shMiMessage")[0].value), t.set("button", "");
            var s = 0,
                a = 0,
                i = 0;
            const n = [];
            for (var r = 0; r < e.length; r++) {
                const l = e[r];
                s++;
                var o = Math.round(s / e.length * 100);
                $("#shMiPrgsInitialize").attr("aria-valuenow", s).css({
                    width: o + "%"
                }).text(s + " / " + e.length.toLocaleString()), n.push($.get("https://www.leitstellenspiel.de/" + l.id.replace("_", "s/") + "/alliance").done((function() {
                    a++;
                    var s = Math.round(a / e.length * 100);
                    $("#shMiPrgsShare").attr("aria-valuenow", a).css({
                        width: s + "%"
                    }).text(a + " / " + e.length.toLocaleString()), "" != $("#shMiMessage")[0].value ? (t.set("mission_reply[mission_id]", l.id.replace("mission_", "")), fetch("https://www.leitstellenspiel.de/mission_replies", {
                        method: "POST",
                        body: new URLSearchParams(t)
                    }).then((function() {
                        i++;
                        var t = Math.round(i / e.length * 100);
                        $("#shMiPrgsMessage").attr("aria-valuenow", i).css({
                            width: t + "%"
                        }).text(i + " / " + e.length.toLocaleString()), "100%" === document.querySelector("#shMiPrgsMessage").style.width && document.querySelector("#shMiShare").removeAttribute("disabled")
                    }))) : $("#shMiPrgsMessage").attr("aria-valuenow", e.length.toLocaleString()).css({
                        width: "100%"
                    }).text(e.length.toLocaleString() + " / " + e.length.toLocaleString())
                })))
            }
            "100%" === document.querySelector("#shMiPrgsMessage").style.width && document.querySelector("#shMiShare").removeAttribute("disabled");
            await Promise.all(n)
        }(e)
    }))
}();
