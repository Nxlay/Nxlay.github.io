(async function () {

    $(document).ready(function () {

        function addMission(mission_id) {
            //console.log('Try adding Item: ' + mission_id);
            var mission_ids = JSON.parse(localStorage.MSORTalliance).m || [];
            if (-1 == mission_ids.indexOf(parseInt(mission_id))) {
                mission_ids.push(mission_id);
                localStorage.setItem('MSORTalliance', JSON.stringify({ m: mission_ids }));
                console.log('Item added: ' + mission_id);
            }
        }

        function removeMission(mission_id) {
            //console.log('Try deleting Item: ' + mission_id);
            var mission_ids = JSON.parse(localStorage.getItem('MSORTalliance')).m || [];
            var index = mission_ids.indexOf(parseInt(mission_id));
            if (-1 != index) {
                mission_ids.splice(index, 1);
                localStorage.setItem('MSORTalliance', JSON.stringify({ m: mission_ids }));
                console.log('Item deleted: ' + mission_id);
            }
        }

        function replaceAlarm(mission_id) {
            //console.log(mission_id);
            const alarm = (publish = false) => {
                var mission_id_now = window.location.pathname.split('/')[2];
                const form = document.querySelector('#mission-form');
                if (!form) return;
                const searchParams = new URLSearchParams();
                Array.from(new FormData(form).entries()).forEach(([key, value]) =>
                    searchParams.append(key, value.toString())
                );

                searchParams.set('alliance_mission_publish', publish ? '1' : '0');
                //console.log(searchParams);
                fetch(`/missions/${mission_id_now}/alarm`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    mode: 'cors',
                    referrer: new URL(`/missions/${mission_id_now}`, window.location.origin).toString(),
                    body: searchParams.toString(),
                })
                .then(() => {
                    window.location.href = `https://www.leitstellenspiel.de/missions/${mission_id}`;
                    //window.location.reload();
                });
            }
            var alertNextBtn = $('.alert_next');
            alertNextBtn.off();
            alertNextBtn.addClass('btn-warning').removeClass('btn-success');
            alertNextBtn.on('click', () => {alarm()});
        }

        /**
         * Hauptseite
         */
        if (window.location.pathname.match(/^\/\#?$/g)) {
            (async () => {
                localStorage.removeItem('MSORTalliance');
                var mission_ids = [];
                var missions = $('#mission_list_sicherheitswache .missionSideBarEntry[search_attribute*="Verband"]:not(.mission_deleted,.MSORTprocessed):has(span.glyphicon-user.hidden)')
                    .add('#mission_list_alliance_event .missionSideBarEntry:not(.mission_deleted,.MSORTprocessed):has(span.glyphicon-user.hidden)')
                    .add('#mission_list_alliance .missionSideBarEntry:not(.mission_deleted,.MSORTprocessed):has(span.glyphicon-user.hidden)');

                Array.from(missions).forEach(m => {
                    $(m).addClass('MSORTprocessed');
                    mission_ids.push(parseInt($(m).attr('mission_id')));
                });

                localStorage.setItem('MSORTalliance', JSON.stringify({ m: mission_ids }));


                let missionMarkerAddOrig = missionMarkerAdd;
                missionMarkerAdd = e => {
                    missionMarkerAddOrig(e);
                    if (e.user_id != user_id) {
                        if ($('#mission_' + e.id + ':not(.mission_deleted,.MSORTprocessed):has(span.glyphicon-user.hidden)').length) {
                            $('#mission_' + e.id).addClass('MSORTprocessed');
                            addMission(e.id);
                        }
                        if ($('#mission_' + e.id + '.mission_deleted').add('#mission_' + e.id + ':has(span.glyphicon-asterisk.hidden)').length) {
                            removeMission(e.id);
                        }
                    }
                };
            })();

        }

        /**
         * Missionsseite
         */
        if (window.location.pathname.match(/^\/missions\/\d+\/?/u)) {
            (async () => {
                var mission_id = window.location.pathname.split('/')[2];
                var next;
                removeMission(mission_id);
                var mission_ids = JSON.parse(localStorage.MSORTalliance).m || [];
                if (localStorage.MSORTown) {
                    var own = JSON.parse(localStorage.MSORTown).n;
                }

                if ($('.alert-info.mission-success').length) {
                    if (mission_ids.length > 0) {
                        window.location.href = `https://www.leitstellenspiel.de/missions/${mission_ids[0]}`;
                    }
                    else {
                        if (own) {
                            window.location.href = `https://www.leitstellenspiel.de/missions/${own}`;
                        }
                    }
                }
                if ($('h3#missionH1').text().match(/\[Verband\]|\[Event\]/g)) {
                    if (mission_ids.length > 0) {
                        replaceAlarm(mission_ids[0]);
                    }
                    else {
                        if (own) {
                            replaceAlarm(own);
                        }
                    }
                }
                else {
                    next = $('#mission_next_mission_btn').attr('href');
                    if (next == '#') {
                        next = mission_id;
                    } else {
                        next = next.split('/')[2];
                    }
                    localStorage.setItem('MSORTown', JSON.stringify({ n: next }));

                    if (mission_ids.length > 0) {
                        replaceAlarm(mission_ids[0]);
                    }
                }
            })();
        }
    });
})();
