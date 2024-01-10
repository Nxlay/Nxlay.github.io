/**
 * Fügt Freigabe-Buttons zu allen eigenen, nicht geteilten Einsätzen hinzu
 */
function addShareButtonsToAll () {
    Array.from($('#mission_list .missionSideBarEntry:not(.mission_deleted) .panel:not(.panel-success,:has(a[id^=ffbMS])) a[id^=alarm_button_]')).forEach((e)=>{
        $(e).before(`<a id="${e.id.replace('alarm_button','ffbMS_btn')}" class="btn btn-xs btn-success ffbMS-btn" title="Einsatz im Verband freigeben"><img class="icon icons8-Share" src="/images/icons8-share.svg" width="12" height="12"></a>`);
    });
};

/**
 * Fügt Freigabe-Button zum einem Einsatz hinzu
 * @param {string} id //missions Id
 */
function addShareButton (id) {
    $('#mission_list div#mission_panel_' + id + ':not(.panel-success,:has(a.ffbMS-btn)) a#alarm_button_' + id).before(`<a id="ffbMS_btn_${id}" class="btn btn-xs btn-success ffbMS-btn" title="Einsatz im Verband freigeben"><img class="icon icons8-Share" src="/images/icons8-share.svg" width="12" height="12"></a>`);
};

/**
 * Lade das Modul für die Einsatzfreigabe aus der Einsatzliste
 */
export async function loadMissionShare() {
    addShareButtonsToAll();

    $('body').on('click','.ffbMS-btn', async function share() {
        const id = /(?<i>\d+)/g.exec(this.id).groups.i;
        $(this).hide();
        $.get('/missions/' + id + '/alliance');
    });

    let missionMarkerAddOrig = missionMarkerAdd;
    missionMarkerAdd = e => {
        missionMarkerAddOrig(e);
        addShareButton (e.id);
    };
};
