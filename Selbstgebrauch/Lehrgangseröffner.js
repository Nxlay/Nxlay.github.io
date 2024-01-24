// ==UserScript==
// @name         Lehrgangseröffner
// @version      1.3.2
// @description  Eröffnet Lehrgänge an Verbandsschulen
// @match        https://www.leitstellenspiel.de/schoolings
// @match        https://www.leitstellenspiel.de/schoolings/
// @icon         https://www.google.com/s2/favicons?sz=64&domain=leitstellenspiel.de
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    $('h3:contains("Offene Lehrgänge")')
        .after(`
            <div>
                <div class="col-sm-2">
                    <label for="schools">Schule:</label>
                    <select id="schools" class="form-control" "name="schools">
                        <option value=""></option>
                        <option value="1">Feuerwehrschule</option>
                        <option value="3">Rettungsschule</option>
                        <option value="8">Polizeischule</option>
                        <option value="10">THW Bundesschule</option>
                   </select>
                </div>
                <div class="col-sm-2">
                    <label for="education">Lehrgang:</label>
                    <select id="education" class="form-control" name="education" class>
                        <option value=""></option>
                    </select>
                </div>
                <div class="col-sm-1">
                    <label for="rooms">Anzahl:</label>
                    <input type="number" id="rooms" min="1" class="form-control" oninput"if(this.value<1)this.value=1;" onchange="if(this.value==''||this.value<1)this.value=1;" value="1">
                </div>
                <div class="col-sm-1">
                    <label for="duration">Start in:</label>
                    <select id="duration" class="form-control" "name="duration">
                        <option value="172800">2 Tage</option>
                        <option value="86400">1 Tag</option>
                        <option value="43200">12 Stunden</option>
                        <option value="3600">1 Stunde</option>
                   </select>
                </div>
                <div class="col-sm-1">
                    <label for="openSchoolings">&nbsp;</label>
                    <div id="openSchoolings"class="btn btn-success" disabled>Lehrgänge öffnen</div>
                </div>
                <br></br><br></br>
            </div>
      `);

    async function createSchoolings(school_type, schooling_type, amount, duration) {

        var aBuildings = await $.getJSON('/api/alliance_buildings');
        var schools = await aBuildings.filter(e => (e.building_type == school_type && (e.extensions.filter(r => r.available).length - e.schoolings.length + 1) > 0));

        var form = new FormData;
        form.set('utf8', '✓');
        form.set('authenticity_token', $('meta[name="csrf-token"]').attr('content'));

        const fetchPromises = [];

        while (amount > 0 && schools.length > 0) {
            var school = schools.pop();
            var free_rooms = school.extensions.length - school.schoolings.length + 1;
            var rooms = (free_rooms <= amount) ? free_rooms : amount;

            form.set('building_rooms_use', rooms);
            form.set('education', schooling_type);
            form.set('alliance[duration]', duration);
            form.set('alliance[cost]', '0');
            form.set('commit', 'Ausbilden');

            fetchPromises.push(
                fetch("https://www.leitstellenspiel.de/buildings/" + school.id + "/education", {
                    method: 'POST',
                    body: new URLSearchParams(form),
                    cache: 'no-cache'
                })
            );

            amount -= rooms;
        }

        if (amount > 0) {
            alert(amount + ' Lehrgänge konnten nicht gestartet werden! Unzureichende Klassenzimmer');
        }

        await Promise.all(fetchPromises);
        $.get("https://www.leitstellenspiel.de/schoolings", function (data) {
            if (($('table#schooling_opened_table')).length != 0) {
                data = data.split('<table class="table table-striped" id="schooling_opened_table">')[1].split('</table>')[0];
                $('table#schooling_opened_table').html(data);
            } else {
                window.location.href = "https://www.leitstellenspiel.de/schoolings";
            }
        });

        enableBtnState(true);
        return amount;
    }

    function enableBtnState(flag) {
        var openBtn = document.getElementById('openSchoolings');
        switch (flag) {
            case true:
                openBtn.removeAttribute('disabled');
                openBtn.addEventListener('click', btnClicked);
                break;
            default:
                openBtn.setAttribute('disabled', 'disabled');
                openBtn.removeEventListener('click', btnClicked);
                break;
        }
    }

    function btnClicked() {
        var schoolID = document.getElementById('schools').value;
        var schoolingID = document.getElementById('education').value;
        var rooms = parseInt(document.getElementById('rooms').value);
        var duration = document.getElementById('duration').value;
        if (confirm('Möchtest du ' + rooms + 'x ' + document.getElementById('education').options[schoolingID].innerHTML + ' öffnen?')) {
            enableBtnState(false);
            createSchoolings(schoolID, schoolingID, rooms, duration);
        }
    };

    document.getElementById('schools').addEventListener('change', function () {
        var selectedSchool = this.value;
        var educationDropdown = document.getElementById('education');
        educationDropdown.innerHTML = "";

        var options = [];

        switch (selectedSchool) {
            case '1':
                options = ["GW-Messtechnik Lehrgang",
                    "GW-Gefahrgut Lehrgang",
                    "Höhenrettung Lehrgang",
                    "ELW 2 Lehrgang",
                    "Wechsellader Lehrgang",
                    "Dekon-P Lehrgang",
                    "Feuerwehrkran Lehrgang",
                    "GW-Wasserrettung Lehrgang",
                    "GW-Taucher Lehrgang",
                    "Notarzt-Ausbildung",
                    "Flugfeldlöschfahrzeug-Ausbildung",
                    "Rettungstreppen-Ausbildung",
                    "Werkfeuerwehr-Ausbildung",
                    "Intensivpflege",
                    "NEA200 Fortbildung",
                    "Drohnen-Schulung"];
                break;
            case '3':
                options = ["Notarzt-Ausbildung",
                    "LNA-Ausbildung",
                    "OrgL-Ausbildung",
                    "SEG - Einsatzleitung",
                    "SEG - GW-San",
                    "GW-Wasserrettung Lehrgang",
                    "GW-Taucher Lehrgang",
                    "Rettungshundeführer (SEG)",
                    "Intensivpflege",
                    "SEG Drohne",
                    "Betreuungsdienst",
                    "Verpflegungshelfer"];
                break;
            case '8':
                options = ["Zugführer (leBefKw)",
                    "Hundertschaftsführer (FüKw)",
                    "Polizeihubschrauber",
                    "Wasserwerfer",
                    "SEK",
                    "MEK",
                    "Hundeführer (Schutzhund)",
                    "Motorradstaffel",
                    "Brandbekämpfung",
                    "Kriminalpolizei",
                    "Dienstgruppenleitung",
                    "Reiterstaffel"];
                break;
            case '10':
                options = ["Zugtrupp",
                    "Fachgruppe Räumen",
                    "Fachgruppe Wassergefahren",
                    "Fachgruppe Bergungstaucher",
                    "Fachgruppe Rettungshundeführer",
                    "Fachgruppe Wasserschaden/Pumpen",
                    "Fachgruppe Schwere Bergung",
                    "Fachgruppe Elektroversorgung",
                    "Trupp Unbemannte Luftfahrtsysteme"];
                break;
            default:
                options = [];
                break;
        }

        for (var i = 0; i < options.length; i++) {
            var option = document.createElement("option");
            option.text = options[i];
            option.value = i;
            educationDropdown.add(option);
        }

        var rooms = parseInt(document.getElementById('rooms').value);
        enableBtnState(selectedSchool && rooms > 0);
    });

})();