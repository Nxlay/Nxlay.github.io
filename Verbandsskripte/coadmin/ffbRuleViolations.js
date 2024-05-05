// ==UserScript==
// @name         Rule Violations
// @namespace    http://tampermonkey.net/
// @version      1.1.2
// @description  try to take over the world!
// @author       You
// @match        https://www.leitstellenspiel.de
// @match        https://www.leitstellenspiel.de/
// @match        https://www.leitstellenspiel.de/#
// @icon         https://www.google.com/s2/favicons?sz=64&domain=leitstellenspiel.de
// @grant        none
// ==/UserScript==


/** -------------------
 *  Module information
 */

const modulePrefix = 'pm';
const rights = 'alliance_coadmin';
const version = '1.1.2';

/** -------------------
 *  Constants and globals
 */

let userfiles = [];
let dataTable;
// Forum Ids
const VIOLATIONS_DATABASE_ID = 2463041;
const VIOLATIONS_KICK_REQUEST_THREAD_ID = 102842;
// Elements
const S = {
    action:              ()=>{return $(`#${modulePrefix}Actions option:selected`)},
    block:               ()=>{return $(`.${modulePrefix}Block`                  )},
    chatBan:             ()=>{return $(`#${modulePrefix}Chatban option:selected`)},
    duration:            ()=>{return $(`#${modulePrefix}Durations`              )},
    edit:                ()=>{return $(`#${modulePrefix}EditCheckbox`           )},
    message:             ()=>{return $(`#${modulePrefix}MessageTextarea`        )},
    messageDummy:        ()=>{return $(`#${modulePrefix}MessageDummy`           )},
    messageField:        ()=>{return $(`#${modulePrefix}MessageInputField`      )},
    messagePreview:      ()=>{return $(`#${modulePrefix}PreviewMessage`         )},
    messagePreviewField: ()=>{return $(`#${modulePrefix}MessagePreviewField`    )},
    modal:               ()=>{return $(`#${modulePrefix}ViolationsModal`        )},
    overview:            ()=>{return $(`#${modulePrefix}Overview`               )},
    player:              ()=>{return $(`#${modulePrefix}Players option:selected`)},
    playerSelection:     ()=>{return $(`#${modulePrefix}Players`                )},
    reason:              ()=>{return $(`#${modulePrefix}ReasonInput`            )},
    reasons:             ()=>{return $(`#${modulePrefix}Reasons`                )},
    required:            ()=>{return $(`.${modulePrefix}Required`               )},
    reset:               ()=>{return $(`#${modulePrefix}ResetButton`            )},
    save:                ()=>{return $(`#${modulePrefix}SaveButton`             )},
    standard:            ()=>{return $(`[id^=${modulePrefix}] option[selected]` )},
    subject:             ()=>{return $(`#${modulePrefix}SubjectTextarea`        )},
    subjectDummy:        ()=>{return $(`#${modulePrefix}SubjectDummy`           )},
    subjectField:        ()=>{return $(`#${modulePrefix}SubjectInputField`      )},
    subjectPreview:      ()=>{return $(`#${modulePrefix}PreviewSubject`         )},
    subjectPreviewField: ()=>{return $(`#${modulePrefix}SubjectPreviewField`    )},
    tooltip:             ()=>{return $(`#${modulePrefix}Tooltip`                )},
    update:              ()=>{return $(`.${modulePrefix}UpdatePreview`          )}
}

/** -------------------
 *  Templates
 */

function textReplacements() {
    return {
        '%SPIELER%': S.player().text(),
        '%AKTION%': S.action().text(),
        '%GRUND%': S.reason()[0].value.trim(),
        '%ICH%': username,
        '%KONSEQUENZ%': (()=>{
            switch(S.action().text()){
                case 'Hinweis': return 'Diese Nachricht dient nur als Hinweis. Gibt in Zukunft besser acht sonst folgen Konsequenzen!';
                case 'Ermahnung': return 'Das ist deine erste Ermahnung. Bei bei weiteren Regelverstößen musst du mit weiteren Konsequenzen rechnen!';
                case 'Verwarnung': return 'Das ist deine letzte Chance. Beim nächsten Regelverstoß geht der Flieger aufs Festland!';
                case 'Verweis': return 'Schade, dass wir uns von dir verabschieden müssen. Bitte anschnallen! *Der Flieger startet*';
                default: return '';
            }
        })(),
        '%DAUER%': S.duration().val() + ' Tage',
        '%ENDE%': formatDate(new Date().getTime() + S.duration().val() * 86400000),
        '%CHATBAN%': S.chatBan().text(),
        '%SIGNATUR%': 'Viele Grüße\ndas Admin/Co-Admin Team',
        '%REGELN%': 'Wir bitten dich darum, dir die Regeln dazu nochmal durchzulesen und hier zu bestätigen.',
    }
}
const messageTemplates = {
    'Standard':         [`%AKTION%: %GRUND%`, `Hallo %SPIELER%,\ndu hast gegen die Verbandsregeln verstoßen: %GRUND%\n\nWir bitten dich darum, dir die Regeln dazu nochmal durchzulesen und hier zu bestätigen.\nBei weiteren Verstößen musst du mit Konsequenzen rechnen!\n\nViele Grüße\ndas Admin/Co-Admin Team`],
    'NoGo-Fahrzeuge':   [`%AKTION%: NoGo-Fahrzeuge`, `Hallo %SPIELER%,\ndu hast gegen die Verbandsregeln verstoßen und ein NoGo-Fahrzeug zu einem Verbandseinsatz geschickt.\n\nEinsätze ab 8.000 Credits beinhalten die Regel der NoGo-Fahrzeuge.\n(NoGo-Fahrzeuge sind bei diesen Einsätzen ELW1, ELW2, AB-Einsatzleitung, FüKw, ELW1/Drohne und ELW2/Drohne)\n\nWir bitten dich darum, dir die Regeln dazu nochmal durchzulesen und hier zu bestätigen.\nBei weiteren Verstößen musst du mit Konsequenzen rechnen!\n\nViele Grüße\ndas Admin/Co-Admin Team`],
    'RD+SW':            [`%AKTION%: Rettungsdienst + Sprechwünsche`, `Hallo %SPIELER%,\ndu hast gegen die Verbandsregeln verstoßen und Patienten eines Verbandseinsatzes bearbeitet, bei dem der Rettungsdienst vom Freigebende gesperrt wurde und/oder deine Sprechwünsche nicht bearbeitet.\n\nBitte achte deshalb in Zukunft auf die Rückmeldungen im Einsatzfenster und schicke bei freiem Rettungsdienst einen richtig eingestellten ELW 1 (SEG) bei deinem Rettungsdienst mit zum Einsatz.\n(siehe Bauschema > SEG unter https://docs.google.com/document/d/1vlHlPrmPd2WQSBC4GhcWUeHMiJiYNrLDNonBqwQ1Y0s/edit)\n\nWir bitten dich, dir die Regeln dazu nochmal durchzulesen und hier zu bestätigen.\nBei weiteren Verstößen musst du mit Konsequenzen rechnen!\n\nViele Grüße\ndas Admin/Co-Admin Team`],
    //'Sprechwünsche':    [``, ``],
}

/** -------------------
 *  Classes
 */

class Entry {
    constructor(action, reason, duration) {
        this.a = action; //a_ction
        this.r = reason; //r_eason
        this.cn = username; //c_reator
        this.ci = user_id;
        this.d = new Date().getTime(); //d_ate
        this.e = parseInt(this.d) + parseInt(duration); //e_nd
        this.x = ''; // placeholder
        this.y = ''; // placeholder
        this.z = ''; // placeholder
    }
}
class Userfile {
    constructor(playerName, playerId) {
        this.pn = playerName; //p_layer
        this.pi = playerId;
        this.i = []; //i_nfraction
        this.a = ''; // placeholder
        this.b = ''; // placeholder
        this.c = ''; // placeholder
    }
}

/** -------------------
 *  Database functions
 */

// LZString
async function addLZStringLibrary() {
    return new Promise((resolve, reject) => {
        const LZStringScript = document.createElement('script');
        LZStringScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/lz-string/1.4.4/lz-string.min.js';
        LZStringScript.onload = function () {
            resolve();
        };
        LZStringScript.onerror = function () {
            reject(new Error('Failed to load LZString library'));
        };
        document.head.appendChild(LZStringScript);
    });
}
// Read from database
async function readFromDatabase(postId) {
    try {
        const raw = await fetchDatabaseData(postId);
        const data = parseDatabaseData(raw);
        return data;
    } catch (error) {
        console.error('Error reading from database:', error);
        throw error;
    }
}
async function fetchDatabaseData(postId) {
    const response = await fetch(`https://www.leitstellenspiel.de/alliance_posts/${postId}/edit?_=${new Date().getTime()}`);
    if (!response.ok) {
        throw new Error('Failed to fetch data from database');
    }
    return response.text();
}
function parseDatabaseData(raw) {
    const start = '=== START DATA ===\n';
    const end = '\n=== END DATA ===';
    const startIdx = raw.indexOf(start);
    const endIdx = raw.indexOf(end);
    if (startIdx === -1 || endIdx === -1) {
        throw new Error('Invalid data format');
    }
    const compressedData = raw.substring(startIdx + start.length, endIdx);
    const decompressedData = LZString.decompressFromBase64(compressedData);
    const jsonData = JSON.parse(decompressedData);
    return jsonData.d;
}
async function getUserfiles() {
    userfiles = await readFromDatabase(VIOLATIONS_DATABASE_ID) || [];
}
// Write to database
async function writeToDatabase(data, postId) {
    try {
        const formData = createDatabaseFormData(data);
        const response = await sendDatabaseRequest(postId, formData);
    } catch (error) {
        console.error('Error writing to database:', error);
    }
}
function createDatabaseFormData(data) {
    const form = new FormData();
    form.set('utf8', '✓');
    form.set('_method', 'put');
    form.set('authenticity_token', $('meta[name="csrf-token"]').attr('content'));
    form.set('alliance_post[content]', '=== START DATA ===\n' + LZString.compressToBase64(JSON.stringify({ d: data })) + '\n=== END DATA ===');
    form.set('commit', 'Speichern');
    return form;
}
async function sendDatabaseRequest(postId, formData) {
    const response = await fetch('https://www.leitstellenspiel.de/alliance_posts/' + postId, {
        method: 'POST',
        body: new URLSearchParams(formData),
    });
    if (!response.ok) {
        throw new Error('Failed sending data to database');
    }
}
async function setUserfiles() {
    await writeToDatabase(userfiles, VIOLATIONS_DATABASE_ID);
}

/** -------------------
 *  HTML
 */

function addModal() {
    $('body').append(`
    <!-- Modal Regelverstöße -->
    <div class="modal fade bd-example-modal-lg in" id="${modulePrefix}ViolationsModal" tabindex="-1" role="dialog"
        aria-labelledby="myLargeModalLabel" aria-hidden="true" style="padding-right: 15px;">
        <div class="modal-dialog modal-lg" role="document"
            style="max-width: 1000px; height: 90%; margin-top: auto; margin-bottom: auto;">
            <div class="modal-content">
                <div class="modal-header">
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true">❌</span>
                    </button>
                    <h3 class="modal-title">
                        <center>Sanktionsliste</center>
                    </h3>
                </div>
                <div class="modal-body" id="${modulePrefix}ViolationsModalBody" style="overflow-y: auto;">
                    <!-- Neuer Eintrag -->
                    <div id="${modulePrefix}NewEntry" style="display: grid;">
                    <div class="row">
                        <div class="col-sm-2">
                            <div class="title"><strong>Aktion</strong></div>
                            <div class="content">
                                <select name="action" id="${modulePrefix}Actions" class="form-control ${modulePrefix}UpdatePreview ${modulePrefix}Required ${modulePrefix}Block">
                                    <option value="0" selected></option>
                                    <option value="Hinweis">Hinweis</option>
                                    <option value="Ermahnung">Ermahnung</option>
                                    <option value="Verwarnung">Verwarnung</option>
                                    <option value="Verweis">Verweis</option>
                                </select>
                            </div>
                        </div>
                        <div class="col-sm-3">
                            <div class="title"><strong>Spieler</strong></div>
                            <div class="content">
                                <select name="player" id="${modulePrefix}Players" class="form-control ${modulePrefix}UpdatePreview ${modulePrefix}Required ${modulePrefix}Block">
                                    <option value="0" selected></option>
                                </select>
                            </div>
                        </div>
                        <div class="col-sm-3">
                            <div class="title"><strong>Grund</strong></div>
                            <div class="content">
                                <input type="text" id="${modulePrefix}ReasonInput" class="form-control ${modulePrefix}UpdatePreview ${modulePrefix}Required ${modulePrefix}Block" list="${modulePrefix}Reasons" maxlength="50" value="">
                                <datalist id="${modulePrefix}Reasons">
                                </datalist>
                            </div>
                        </div>
                        <div class="col-sm-2">
                            <div class="title"><strong>Dauer</strong></div>
                            <div class="content">
                                <select name="duration" id="${modulePrefix}Durations" class="form-control ${modulePrefix}UpdatePreview ${modulePrefix}Required ${modulePrefix}Block">
                                    <option value="0"></option>
                                    <option value="7">7 Tage</option>
                                    <option value="14">14 Tage</option>
                                    <option value="30" selected>30 Tage</option>
                                    <option value="90">90 Tage</option>
                                    <option value="180">180 Tage</option>
                                </select>
                            </div>
                        </div>
                        <div class="col-sm-2">
                            <div class="title"><strong>Chatban</strong></div>
                            <div class="content">
                                <select name="chatban" id="${modulePrefix}Chatban" class="form-control ${modulePrefix}UpdatePreview ${modulePrefix}Block">
                                    <option value="0" selected></option>
                                    <option value="300">5 Minuten</option>
                                    <option value="900">15 Minuten</option>
                                    <option value="1800">30 Minuten</option>
                                    <option value="3600">1 Stunde</option>
                                    <option value="21600">6 Stunde</option>
                                    <option value="43200">12 Stunde</option>
                                    <option value="86400">1 Tag</option>
                                    <option value="604800">7 Tage</option>
                                    <option value="1209600">14 Tage</option>
                                </select>
                            </div>
                        </div>
                    </div>
                        <div>
                            <div class="col-sm-1" style="margin-top: 15px;">Betreff:</div>
                            <div class="col-sm-11" id="${modulePrefix}SubjectInputField" style="margin-top: 15px; display: none;">
                                <textarea name="subject" id="${modulePrefix}SubjectTextarea" placeholder="Betreff..."
                                    class="form-control ${modulePrefix}UpdatePreview ${modulePrefix}Block ${modulePrefix}Required" style="resize: none" rows="1"
                                    oninput="this.value = this.value.replace(/\\n/g,'')"
                                    maxlength="50" spellcheck="false">%AKTION%: %GRUND%</textarea>
                            </div>
                            <div class="col-sm-11" id="${modulePrefix}SubjectPreviewField" style="margin-top: 15px; display: block;">
                                <div id="${modulePrefix}SubjectBorder" class="panel panel-default" style="margin-bottom: 0px">
                                    <div id="${modulePrefix}PreviewSubject" style="padding: 6px 12px 6px 12px">
                                        <br>
                                    </div>
                                </div>
                            </div>
                            <input id="${modulePrefix}SubjectDummy" type="hidden" value="" class="${modulePrefix}Required">
                        </div>
                        <div>
                            <div class="col-sm-1" style="margin-top: 15px;">
                                Nachricht:
                                <span class="glyphicon glyphicon-info-sign pull-left" id="${modulePrefix}Tooltip"></span>
                            </div>
                            <div class="col-sm-11" id="${modulePrefix}MessageInputField"
                                style="margin-top: 15px; margin-bottom: 20px; display: none;">
                                <textarea name="message" id="${modulePrefix}MessageTextarea" placeholder="Nachricht..."
                                    class="form-control ${modulePrefix}UpdatePreview ${modulePrefix}Block ${modulePrefix}Required" style="resize: none"
                                    rows="11" spellcheck="false"></textarea>
                            </div>
                            <div class="col-sm-11" id="${modulePrefix}MessagePreviewField" style="margin-top: 15px; display: block;">
                                <div id="${modulePrefix}MessageBorder" class="panel panel-default">
                                    <div id="${modulePrefix}PreviewMessage" style="padding: 6px 12px 6px 12px">
                                        <br>
                                    </div>
                                </div>
                            </div>
                            <input id="${modulePrefix}MessageDummy" type="hidden" value="" class="${modulePrefix}Required">
                        </div>
                        <div>
                            <div class="col-sm-1"></div>
                            <div class="col-sm-11">
                                <div class="pull-left">
                                    <input type="checkbox" id="${modulePrefix}EditCheckbox">
                                    bearbeiten
                                </div>
                                <div class="pull-right">
                                    <button class="btn btn-default ${modulePrefix}Block" id="${modulePrefix}ResetButton"
                                        style="margin-right: 5px;">Zurüchsetzen</button>
                                    <button class="btn btn-success ${modulePrefix}Block" id="${modulePrefix}SaveButton">Speichern</button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <hr>
                    <!-- Übersicht -->
                    <div id="${modulePrefix}Overview">
                        <style>
                            .badge-success { background-color: #5cb85c; }
                            .badge-warning { background-color: #f0ad4e; }
                            .badge-danger { background-color: #d9534f; }
                            .expired { opacity: 0.5; }
                        </style>
                        <table class="table table-striped" id="${modulePrefix}OverviewTable">
                            <thead>
                                <tr>
                                    <th>Aktion</th>
                                    <th>Name</th>
                                    <th>Grund</th>
                                    <th>Ersteller</th>
                                    <th>Datum</th>
                                    <th>Ende</th>
                                </tr>
                            </thead>
                            <tbody>
                            </tbody>
                        </table>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-danger" data-dismiss="modal">Schließen</button>
                    <div class="pull-left">v ${version}</div>
                </div>
            </div>
        </div>
    </div>
    `);
}
// Player Selection
async function addPlayerSelection() {
    try {
        const playerSelect = S.playerSelection()[0];
        const userData = await fetchPlayerData();
        renderPlayerOptions(playerSelect, userData);
    } catch (error) {
        console.error('Failed to add player selection:', error);
    }
}
async function fetchPlayerData() {
    const response = await fetch('https://www.leitstellenspiel.de/api/allianceinfo');
    if (!response.ok) {
        throw new Error('Failed to fetch player data');
    }
    return response.json();
}
function renderPlayerOptions(selectElement, userData) {
    userData.users.sort((a, b) => {
        const nameA = a.name.toUpperCase();
        const nameB = b.name.toUpperCase();
        if (nameA < nameB) return -1;
        if (nameA > nameB) return 1;
        return 0;
    }).forEach(user => {
        const option = document.createElement('option');
        option.value = user.id;
        option.title = user.id;
        option.textContent = user.name;
        selectElement.appendChild(option);
    });
}
// Template Selection
function addMessageTemplates() {
    for (const key in messageTemplates) {
        const option = document.createElement('option');
        option.value = key;
        S.reasons()[0].append(option);
    }
}
// Tooltip
function addTooltip() {
    const replacements = textReplacements();
    var tooltipString = `Textersetzungen:\n`;
    for (const key in replacements) {
        tooltipString = tooltipString + key + `\n`;
    }
    S.tooltip()[0].title = tooltipString;
}
// Menu button
function addMenuEntry() {
    const button = $('<a>', {
        href: 'javascript:void(0)',
        id: `${modulePrefix}MenuButton`,
        text: 'Verstöße'
    }).click(menuEntryClickHandler);

    const li = $('<li>', {
        class: 'allinace_true',
        role: 'presentation'
    }).append(button);

    $('ul[aria-labelledby="menu_alliance"] li:nth-child(4)').after(li);
}
async function menuEntryClickHandler() {
    S.modal().modal("show");
    await getUserfiles();
    initializeTableEntries();
}

/** -------------------
 *  DataTable (Overview)
 */

async function addDataTableLibrary() {
    return new Promise((resolve, reject) => {
        const DataTableScript = document.createElement('script');
        DataTableScript.type = "text/javascript";
        DataTableScript.src = "https://cdn.datatables.net/1.11.5/js/jquery.dataTables.js";
        DataTableScript.onload = function () {
            resolve();
        };
        DataTableScript.onerror = function () {
            reject(new Error('Failed to load DataTable library'));
        };
        document.head.appendChild(DataTableScript);

        const dataTableCSSLink = document.createElement('link');
        dataTableCSSLink.rel = "stylesheet";
        dataTableCSSLink.type = "text/css";
        dataTableCSSLink.href = "https://cdn.datatables.net/1.11.5/css/jquery.dataTables.css";
        document.head.appendChild(dataTableCSSLink);
    });
}
function initializeDataTable() {
    dataTable = new DataTable(`#${modulePrefix}OverviewTable`, {
        "order": [[4, 'desc']],
        pageLength: 50
    });
}
function initializeTableEntries() {
    var entries = []
    dataTable.clear();
    userfiles.forEach(player => {
        player.i.forEach(action => {
            if (action.e > new Date().getTime()) {
                entries.push(createEntryElement(player.pn, player.pi, action));
            }
        });
    });
    dataTable.rows.add(entries).draw();
}
function createEntryElement(name, id, action) {
    const currentTime = new Date().getTime();
    const tr = document.createElement('tr');
    tr.classList.add((action.e < currentTime) ? "expired" : "ongoing");
    tr.innerHTML = `
        <td><span class="badge ${actionToColor(action.a, 'badge')}">${action.a}</span></td>
        <td title="${id}"><a class="lightbox-open" href="/profile/${id}">${name}</a></td>
        <td>${action.r}</td>
        <td title="${action.ci}"><a class="lightbox-open" href="/profile/${action.ci}">${action.cn}</a></td>
        <td><span hidden>${action.d}</span>${formatDate(action.d)}</td>
        <td><span hidden>${action.e}</span>${formatDate(action.e)}</td>
    `;
    return tr;
}

/** -------------------
 *  Input and GUI
 */

function updatePreview() {
    const replacements = textReplacements();

    if (S.message().val().trim() == '') {
        S.messagePreview()[0].innerHTML = '<br>';
        S.messageDummy().val('');
    }
    else {
        S.messagePreview()[0].innerHTML = S.message()
            .val()
            .replace(/%\w+%/g, match => (replacements[match]) ? `<span title="` + match + `">` + replacements[match] + `</span>` : `<strong style="color: red">` + match + `</strong>`)
            .trim()
            .replaceAll('\n', '<br>');
        S.messageDummy()[0].value = S.message()
            .val()
            .replace(/%\w+%/g, match => (replacements[match]) ? replacements[match] : match)
            .trim();
    }

    if (S.subject().val() == '') {
        S.subjectPreview()[0].innerHTML = '<br>';
        S.subjectDummy().val('');
    }
    else {
        S.subjectPreview()[0].innerHTML = S.subject()
            .val()
            .replace(/%\w+%/g, match => (replacements[match]) ? `<span title="` + match + `">` + replacements[match] + `</span>` : `<strong style="color: red">` + match + `</strong>`)
            .trim()
            .replaceAll('\n', '');
        S.subjectDummy()[0].value = S.subject()
            .val()
            .replace(/%\w+%/g, match => (replacements[match]) ? replacements[match] : match)
            .trim()
            .replaceAll('\n', '');
    }
}
function loadMessageTemplate(reason) {
    const message = messageTemplates[reason];

    if (message) {
        [S.subject()[0].value, S.message()[0].value] = message;
    }

    updatePreview();
}
function checkEdit(checkbox) {
    const states = {false: 'none', true: 'block'};
    const checked = checkbox.checked;

    S.messageField().css('display', states[checked]);
    S.subjectField().css('display', states[checked]);
    S.messagePreviewField().css('display', states[!checked]);
    S.subjectPreviewField().css('display', states[!checked]);

    updatePreview();
}
function resetInputs() {
    S.standard().prop('selected', true);
    S.reason().val('');
    [S.subject()[0].value, S.message()[0].value] = messageTemplates['Standard'];

    updatePreview();
    checkEnableSaveButton();
}
function toggleInput (enable) {
    S.block().prop('disabled', !enable);
}
function checkEnableSaveButton () {
    const requirements = S.required().filter(function () {
        return $(this).val() == 0 || $(this).val() == '';
    }).length == 0;

    S.save().prop('disabled', !requirements);
}

/** -------------------
 *  Action Functions
 */

async function createNewEntry() {
    try {
        await getUserfiles();
        let player = userfiles.find(p => p.pi == S.player().val());
        if (!player) {
            player = new Userfile(S.player().text(), S.player().val());
            userfiles.push(player);
        }
        const playerEntry = new Entry(S.action().text(), S.reason().val(), S.duration().val()*86400000);
        player.i.push(playerEntry);
        await setUserfiles();

        const entryTr = createEntryElement(S.player().text(), S.player().val(), playerEntry);
        dataTable.row.add(entryTr).draw();
    }
    catch (error) {
        console.error('Creating new entry failed!');
    }
}
// Sending Message tp player
async function sendMessage() {
    try {
        const formData = createMessageFormData();
        await sendFormData(formData);
    } catch (error) {
        console.error('Failed to send message:', error);
    }
}
function createMessageFormData() {
    const form = new FormData();
    form.set('utf8', '✓');
    form.set('authenticity_token', $('meta[name="csrf-token"]').attr('content'));
    form.set('message[recipients]', S.player().text());
    form.set('message[subject]', S.subjectDummy().val());
    form.set('message[body]', S.messageDummy().val());
    form.set('commit', 'Nachricht absenden');
    return form;
}
async function sendFormData(formData) {
    const response = await fetch('https://www.leitstellenspiel.de/messages', {
        method: 'POST',
        body: new URLSearchParams(formData)
    });
    if (!response.ok) {
        throw new Error('Failed to send message');
    }
}
// Chatban
async function setChatban() {
    if (S.chatBan().val() != 0) {
        const response = await fetch(`https://www.leitstellenspiel.de/profile/${S.player().val()}/chatban/${S.chatBan()}`);
        if (!response.ok) {
            throw new Error('Failed to set chatban');
        }
    }
}
// Ban and kick Player
async function banPlayer() {
    if (S.action().val() !== 'Verweis') {
        return;
    }

    const form = createBanFormData();
    try {
        if (alliance_admin || alliance_owner) {
            await banPlayerDirectly(form);
        } else {
            await requestBanForPlayer(form);
        }
    } catch (error) {
        console.error('Failed to ban player:', error);
    }
}
function createBanFormData() {
    const form = new FormData();
    form.set('utf8', '✓');
    form.set('authenticity_token', $('meta[name="csrf-token"]').attr('content'));
    return form;
}
async function banPlayerDirectly(form) {
    if (confirm(`Ban player ${S.player().text()} [${S.player().val()}] (Kick + Block)?`)) {
        try {
            await kickPlayer();
            await blockPlayer(form);
        } catch (error) {
            console.error('Failed to kick or block player:', error);
        }
    }
}
async function kickPlayer() {
    const response = await fetch(`https://www.leitstellenspiel.de/verband/kick/${S.player().val()}`);
    if (!response.ok) {
        throw new Error('Failed to kick player');
    }
}
async function blockPlayer(form) {
    const response = await fetch(`https://www.leitstellenspiel.de/allianceIgnore/${S.player().val()}/add`, {
        method: 'POST',
        body: new URLSearchParams(form)
    });
    if (!response.ok) {
        throw new Error('Failed to block player');
    }
}
async function requestBanForPlayer(form) {
    if (confirm(`Request ban for player ${S.player().text()} [${S.player().val()}]?`)) {
        const content = `Name: ${S.player().text()}\nGrund: ${S.reason().val()}\nLink: [url=https://www.leitstellenspiel.de/profile/${S.player().val()}]https://www.leitstellenspiel.de/profile/${S.player().val()}[/url]`;
        form.set('alliance_post[content]', content);
        form.set('commit', 'Speichern');
        try {
            await fetch(`https://www.leitstellenspiel.de/alliance_posts?alliance_thread_id=${VIOLATIONS_KICK_REQUEST_THREAD_ID}`, {
                method: 'POST',
                body: new URLSearchParams(form)
            });
        } catch (error) {
            console.error('Failed to request ban for player:', error);
        }
    }
}
// Save button callback
async function saveButtonClickHandler() {
    try {
        toggleInput(false);
        await createNewEntry();
        await sendMessage();
        await setChatban();
        await banPlayer();
        resetInputs();
        toggleInput(true);
        checkEnableSaveButton();
    }
    catch (error) {
        console.error('Saving new entry failed:', error);
    }
}

/** -------------------
 *  Utility
 */

function actionToColor(action, type) {
    switch (action) {
        case 'Hinweis': return '';
        case 'Ermahnung': return type + '-success';
        case 'Verwarnung': return type + '-warning';
        case 'Verweis': return type + '-danger';
        default: return '';
    }
}
function formatDate(time) {
    const date = new Date(time);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
}

/** -------------------
 *  Modul export function
 */

(async()=>{$(document).ready(function(){(async function(){  //Standalone
//export async function loadViolationsModule() {              // Module
    if (!(alliance_coadmin || alliance_admin || alliance_owner)) return;
    try {
        addModal();
        await addDataTableLibrary();
        await addLZStringLibrary();
        await addPlayerSelection();
        await getUserfiles();
        addTooltip();
        addMessageTemplates();
        resetInputs();
        checkEnableSaveButton();
        initializeDataTable();
        initializeTableEntries();

        // Eventlisteners
        S.save().on('click', function () {
            saveButtonClickHandler();
        });
        S.edit().on('change', function () {
            checkEdit(this);
        });
        S.reset().on('click', function () {
            resetInputs();
        });
        S.reason().on('change', function () {
            loadMessageTemplate(this.value);
        });
        S.update().on('input', function () {
            updatePreview();
        });
        S.required().on('input', function () {
            checkEnableSaveButton();
        });

        // If all previous steps were successful add open button
        addMenuEntry();
    }
    catch (error) {
        console.error('Loading Violations module failed:', error);
    }

})();})})();    // Standalone
//}               // Module