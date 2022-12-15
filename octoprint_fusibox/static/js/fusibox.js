let FusiBox;
$(function() {
    function FusiBoxViewModel(parameters) {
        FusiBox = this;
        this.settingsModel = parameters[0];

        this.msToTime = (duration) => {
            let seconds = Math.floor((duration / 1000) % 60),
                minutes = Math.floor((duration / (1000 * 60)) % 60),
                hours = Math.floor((duration / (1000 * 60 * 60)) % 24);
            
            hours = (hours < 10) ? "0" + hours : hours;
            minutes = (minutes < 10) ? "0" + minutes : minutes;
            seconds = (seconds < 10) ? "0" + seconds : seconds;
            
            return hours + ":" + minutes + ":" + seconds
        }

        this.onChangePanelMode = () => {
            let mode = $('#panelMode').val();

            if (mode == 'manual') {
                $('#panelDistanceGroup').hide();
            } else if (mode == 'distance') {
                $('#panelDistanceGroup').show();
            }
        }

        this.onChangeRelayMode = () => {
            let mode = $('#relayMode').val();

            if (mode == 'manual') {
                $('#relayScheduleGroup').hide();
                $('#relayTimerGroup').hide();
            } else if (mode == 'schedule') {
                $('#relayScheduleGroup').show();
                $('#relayTimerGroup').hide();
            } else if (mode == 'timer') {
                $('#relayScheduleGroup').hide();
                $('#relayTimerGroup').show();
            }
        }

        this.onChangeFanMode = () => {
            let mode = $('#fanMode').val();

            if (mode == 'manual') {
                $('#fanTemperatureGroup').hide();
                $('#fanScheduleGroup').hide();
                $('#fanTimerGroup').hide();
            } else if (mode == 'schedule') {
                $('#fanTemperatureGroup').hide();
                $('#fanScheduleGroup').show();
                $('#fanTimerGroup').hide();
            } else if (mode == 'temperature') {
                $('#fanTemperatureGroup').show();
                $('#fanScheduleGroup').hide();
                $('#fanTimerGroup').hide();
            } else if (mode == 'timer') {
                $('#fanTemperatureGroup').hide();
                $('#fanScheduleGroup').hide();
                $('#fanTimerGroup').show();
            }
        }

        this.fanTimerInputManual = data => {
            if (data != 'manual') {
                // $('#fanTimerInput').remove();
                return;
            }
            
            $('<input style="margin-left: 10px; width: 30%;" type="number" placeholder="' + gettext('Insert the timeout value') + '" data-bind="value: settings.plugins.fusibox.fanTimeout" id="fanTimerInput">').insertAfter("#fanTimerSelect");
            $('#fanTimerSelect').removeAttr('data-bind');
        }

        this.relayTimerInputManual = data => {
            if (data != 'manual') {
                // $('#relayTimerInput').remove();
                return;
            }

            $('<input style="margin-left: 10px; width: 30%;" type="number" placeholder="' + gettext('Insert the timeout value') + '" data-bind="value: settings.plugins.fusibox.relayTimeout" id="relayTimerInput">').insertAfter("#relayTimerSelect");
            $('#relayTimerSelect').removeAttr('data-bind');
        }

        this.onSettingsShown = () => {            
            $('#panelMode').change();
            $('#relayMode').change();
            $('#fanMode').change();
            $('#fanTimerSelect').change();
            $('#relayTimerSelect').change();
            
            if ($('#relayTimerSelect option[value="' + this.settings['relay_timeout']['value'] + '"]').length == 0) {
                $('<option value="' + Number(this.settings['relay_timeout']['value']) + '">' + (Number(this.settings['relay_timeout']['value']) / 3600000) + ' ' + gettext('hours') + '</option>').insertBefore('#relayTimerSelect>option:last-child');
                $('#relayTimerSelect').val(Number(this.settings['relay_timeout']['value']));
                $('#relayTimerSelect').change();
            }
            
            if ($('#fanTimerSelect option[value="' + this.settings['fan_timeout']['value'] + '"]').length == 0) {
                $('<option value="' + Number(this.settings['fan_timeout']['value']) + '">' + (Number(this.settings['fan_timeout']['value']) / 3600000) + ' ' + gettext('hours') + '</option>').insertBefore('#fanTimerSelect>option:last-child');
                $('#fanTimerSelect').val(Number(this.settings['fan_timeout']['value']));
                $('#fanTimerSelect').change();
            }
        }
    
        this.onStartup = () => {
            $.get(PLUGIN_BASEURL  + 'fusibox/video/stop');
            $.get(PLUGIN_BASEURL  + 'fusibox/audio/stop');
        }

        this.sendSettings = data => {
            $.ajax({
                method: 'POST',
                url: PLUGIN_BASEURL  + 'fusibox/settings',
                contentType: 'application/json',
                data
            });
        }

        this.weekdays = days => {
            return days.map(item => {
                letters = ['Mo','Tu','We','Th','Fr','Sa','Su'];
                return letters[item]
            });
        }
    
        this.settings = {};
        this.sensors = {};
        this.outputs = {};

        this.onDataUpdaterPluginMessage = (plugin, message) => {
            if (plugin !== 'fusibox') return;

            if (message.type === 'setup') {
                if (message.status === 'completed') {
                    this.setupCompleted(true);
                    this.setupInProgress(true);
                }
            }

            if (typeof message === 'object') return;

            let obj = message.split('**').pop();
            let data = message.split('**').shift();

            obj = JSON.parse(obj);
            
            if (data == 'outputs') {
                if (this.settings['panel_mode']) {
                    if (!['manual', 'timer'].includes(this.settings['panel_mode']['value'])) {
                        $('#light-button').prop('disabled', true);
                    }

                    if (this.settings['panel_mode']['value'] == 'distance') {
                        $('#light-button > span').html('&nbsp;<i class="fa fa-ruler"></i>');
                        $('#light-button').attr('title', 'Controlled by distance (' + this.settings['panel_distance']['value'] + ' cm)');
                    } else {
                        $('#light-button > span').html('');
                        $('#light-button').attr('title', 'Controlled by manual button');
                    }
                }

                if (this.settings['fan_mode']) {
                    if (!['manual', 'timer'].includes(this.settings['fan_mode']['value'])) {
                        $('#fan-button').prop('disabled', true);
                    }
                    
                    if (this.settings['fan_mode']['value'] == 'timer') {
                        let rest = Math.round((Number(this.settings['fan_timeout']['value']) - ((new Date()).getTime() - Number(this.settings['fan_timeout']['started']) * 1000)) / 1000);
                        $('#fan-button > span').html('&nbsp;<i class="fa fa-clock"></i>&nbsp;' + (rest > 0 ? ('(' + this.msToTime(rest * 1000) + ')') : ''));
                        $('#fan-button').attr('title', 'Controlled by timer (' + this.msToTime(Number(this.settings['fan_timeout']['value'])) + ')');
                    } else if (this.settings['fan_mode']['value'] == 'schedule') {
                        $('#fan-button > span').html('&nbsp;<i class="fa fa-calendar"></i>');
                        $('#fan-button').attr('title', 'Controlled by schedule (' + this.settings['fan_schedule']['start'] + ' -> ' + this.settings['fan_schedule']['end'] + ' - ' + this.weekdays(this.settings['fan_schedule']['days'].sort()) + ')');
                    } else if (this.settings['fan_mode']['value'] == 'temperature') {
                        $('#fan-button > span').html('&nbsp;<i class="fa fa-thermometer-full"></i>');
                        $('#fan-button').attr('title', 'Controlled by temperature (' + this.settings['fan_temperature']['max'] + ' ºC)');
                    } else {
                        $('#fan-button > span').html('');
                        $('#fan-button').attr('title', 'Controlled by manual button');
                    }
                }
                
                if (this.settings['relay_mode']) {
                    if (!['manual', 'timer'].includes(this.settings['relay_mode']['value'])) {
                        $('#power-button').prop('disabled', true);
                    }
                    
                    if (this.settings['relay_mode']['value'] == 'timer') {
                        let rest = Math.round((Number(this.settings['relay_timeout']['value']) - ((new Date()).getTime() - Number(this.settings['relay_timeout']['started']) * 1000)) / 1000);
                        $('#power-button > span').html('&nbsp;<i class="fa fa-clock"></i>&nbsp;' + (rest > 0 ? ('(' + this.msToTime(rest * 1000) + ')') : ''));
                        $('#power-button').attr('title', 'Controlled by timer (' + this.msToTime(Number(this.settings['relay_timeout']['value'])) + ')');
                    } else if (this.settings['relay_mode']['value'] == 'schedule') {
                        $('#power-button > span').html('&nbsp;<i class="fa fa-calendar"></i>');
                        $('#power-button').attr('title', 'Controlled by schedule (' + this.settings['relay_schedule']['start'] + ' -> ' + this.settings['relay_schedule']['end'] + ' - ' + this.weekdays(this.settings['relay_schedule']['days'].sort()) + ')');
                    } else {
                        $('#power-button > span').html('');
                        $('#power-button').attr('title', 'Controlled by manual button');
                    }
                }
                
                
                $("#light-button").removeClass('btn-primary');
                if (Number(obj['led_panel']['value'])) {
                    $("#light-button").removeClass('btn-danger');
                    $('#light-button').addClass('btn-success');
                } else {
                    $("#light-button").addClass('btn-danger');
                    $('#light-button').removeClass('btn-success');
                }
                
                $("#power-button").removeClass('btn-primary');
                if (Number(obj['relay_1']['value'])) {
                    $("#power-button").removeClass('btn-danger');
                    $('#power-button').addClass('btn-success');
                } else {
                    $("#power-button").addClass('btn-danger');
                    $('#power-button').removeClass('btn-success');
                }
                
                $("#fan-button").removeClass('btn-primary');
                if (Number(obj['fan_1']['value']) || Number(obj['fan_2']['value'])) {
                    $("#fan-button").removeClass('btn-danger');
                    $('#fan-button').addClass('btn-success');
                } else {
                    $("#fan-button").addClass('btn-danger');
                    $('#fan-button').removeClass('btn-success');
                }

                
                if (Object.keys(this.outputs).length > 0) {
                    if (
                        (this.settings['panel_mode'] && ['manual', 'timer'].includes(this.settings['panel_mode']['value'])) && 
                        $('#light-button').hasClass(Number(this.settings['panel_value']['value']) ? 'btn-success' : 'btn-danger')
                    ) {
                        $("#light-button").prop('disabled', false);
                    }
                    if ((
                            this.settings['fan_mode'] && 
                            ['manual', 'timer'].includes(this.settings['fan_mode']['value'])
                        ) && 
                        $('#fan-button').hasClass(Number(this.settings['fan_value']['value']) ? 'btn-success' : 'btn-danger')
                    ) {
                        $("#fan-button").prop('disabled', false);
                    }
                    if ((
                            this.settings['relay_mode'] && 
                            ['manual', 'timer'].includes(this.settings['relay_mode']['value'])
                        ) && 
                        $('#power-button').hasClass(Number(this.settings['relay_value']['value']) ? 'btn-success' : 'btn-danger')
                    ) {
                        $("#power-button").prop('disabled', false);
                    }
                }

                this.outputs = obj;
            }
            
            if (data == 'sensors') {
                $('#temperature').html(obj.temperature.value);
                $('#humidity').html(obj.humidity.value);
                $('#temperature2').html(obj.temperature.value);
                $('#humidity2').html(obj.humidity.value);
            }
            
            if (data == 'settings') {
                $("#camera-button").removeClass('btn-primary');
                if (Number(obj['camera']['value'])) {
                    $('#camera-container img').attr('src', PLUGIN_BASEURL + 'fusibox/video/feed/');
                    $('#camera-container').show();
                    $("#camera-button").removeClass('btn-danger');
                    $("#camera-button").addClass('btn-success');
                } else {
                    $('#camera-container img').attr('src', '');
                    $('#camera-container').hide();
                    $("#camera-button").addClass('btn-danger');
                    $("#camera-button").removeClass('btn-success');
                }
                
                $("#mic-button").removeClass('btn-primary');
                if (Number(obj['mic']['value'])) {
                    $('#mic-container audio').attr('src', PLUGIN_BASEURL + 'fusibox/audio/feed');
                    $('#mic-container').show();
                    $("#mic-button").removeClass('btn-danger');
                    $("#mic-button").addClass('btn-success');
                } else {
                    $('#mic-container audio').attr('src', '');
                    $('#mic-container').hide();
                    $("#mic-button").addClass('btn-danger');
                    $("#mic-button").removeClass('btn-success');
                }
                
                if (Object.keys(this.settings).length > 0) {
                    if ($("#camera-button").hasClass(Number(obj['camera']['value']) ? 'btn-success' : 'btn-danger')) {
                        $("#camera-button").prop('disabled', false);
                    }
                    if ($("#mic-button").hasClass(Number(obj['mic']['value']) ? 'btn-success' : 'btn-danger')) {
                        $("#mic-button").prop('disabled', false);
                    }
                }

                this.settings = obj;
            }
        };
    
        this.onStartupComplete = () => {
            console.log($('#fanTimerSelect').val());
            $('#panelMode').change(this.onChangePanelMode);
            $('#relayMode').change(this.onChangeRelayMode);
            $('#fanMode').change(this.onChangeFanMode);

            $('#relayTimerSelect').change(e => {
                if (e.target.value !== '') {
                    $('#relayTimerInput').hide();
                    return;
                }
                $('#relayTimerInput').show();
            });
            
            $('#fanTimerSelect').change(e => {
                if (e.target.value !== '') {
                    $('#fanTimerInput').hide();
                    return;
                }
                $('#fanTimerInput').show();
            });

            $('#fanTimerInput').change(e => {
                let value = e.target.value;
                console.log(value);

                $('<option value="' + (value * 3600000) + '">' + value + ' ' + gettext('hours') + '</option>').insertBefore('#fanTimerSelect>option:last-child');
                $('#fanTimerSelect').val(value * 3600000);
                $('#fanTimerSelect').change();
            });
            
            $('#relayTimerInput').change(e => {
                let value = e.target.value;
                console.log(value);

                $('<option value="' + (value * 3600000) + '">' + value + ' ' + gettext('hours') + '</option>').insertBefore('#relayTimerSelect>option:last-child');
                $('#relayTimerSelect').val(value * 3600000);
                $('#relayTimerSelect').change();
            });

            setInterval(() => {
                $.get(PLUGIN_BASEURL  + 'fusibox/outputs');
                $.get(PLUGIN_BASEURL  + 'fusibox/sensors');
            }, 1000);
            
            $.get(PLUGIN_BASEURL  + 'fusibox/settings');

            setInterval(() => {
                $.get(PLUGIN_BASEURL  + 'fusibox/settings');
            }, 2000);
        };
        
        $("#camera-button").click(e => {
            e.target.disabled = true;
            if (Number(this.settings['camera']['value'])) {
                this.sendSettings('{"camera":{"value":0}}');
            } else {
                this.sendSettings('{"camera":{"value":1}}');
            }
            $.get(PLUGIN_BASEURL  + 'fusibox/settings');
        });

        $("#camera-action-image").click(e => {
            window.open(PLUGIN_BASEURL  + 'fusibox/image/feed', '_blank');
            this.refreshFiles();
        });

        $("#camera-action-video").click(e => {
            if (e.target.style.color == "red") {
                e.target.style.color = "black";
                $.get(PLUGIN_BASEURL + 'fusibox/video/stop');
                this.settingsModel.settings.plugins.fusibox.videoRecording(false);
                setTimeout(() => this.refreshFiles(), 2000);
            } else {
                $.get(PLUGIN_BASEURL + 'fusibox/video/start');
                this.settingsModel.settings.plugins.fusibox.videoRecording(true);
                e.target.style.color = "red";
            }
        });
        
        $("#mic-action-audio").click(e => {
            if (e.target.style.color == "red") {
                e.target.style.color = "black";
                this.settingsModel.settings.plugins.fusibox.audioRecording(false);
                $.get(PLUGIN_BASEURL + 'fusibox/audio/stop');
                setTimeout(() => this.refreshFiles(), 2000);
            } else {
                $.get(PLUGIN_BASEURL + 'fusibox/audio/start');
                this.settingsModel.settings.plugins.fusibox.audioRecording(true);
                e.target.style.color = "red";
            }
        });

        $("#mic-button").click(e => {
            e.target.disabled = true;
            if (Number(this.settings['mic']['value'])) {
                this.sendSettings('{"mic":{"value":0}}');
            } else {
                this.sendSettings('{"mic":{"value":1}}');
            }
            $.get(PLUGIN_BASEURL  + 'fusibox/settings');
        });

        $("#light-button").click(e => {
            e.target.disabled = true;
            if (Number(this.outputs['led_panel']['value'])) {
                this.sendSettings('{"panel_value":{"value":0}}');
            } else {
                this.sendSettings('{"panel_value":{"value":1}}');
            }
            $.get(PLUGIN_BASEURL  + 'fusibox/settings');
        });

        $("#power-button").click(e => {
            e.target.disabled = true;
            if (this.settings['relay_mode'] && this.settings['relay_mode']['value'] == 'timer') {
                if (Number(this.outputs['relay_1']['value'])) {
                    if (confirm(gettext('Are you sure?'))) {
                        this.sendSettings('{"relay_timeout":{"started":' + ((new Date()).getTime() * (Number(this.outputs['relay_1']['value']) * 0.1 || 1) / 1000) + '}}');
                    } else {
                        e.target.disabled = false;
                    }
                } else {
                    this.sendSettings('{"relay_timeout":{"started":' + ((new Date()).getTime() * (Number(this.outputs['relay_1']['value']) * 0.1 || 1) / 1000) + '}}');
                }
            } else {
                if (Number(this.outputs['relay_1']['value'])) {
                    if (confirm(gettext('Are you sure?'))) {
                        this.sendSettings('{"relay_value":{"value":0}}');
                    } else {
                        e.target.disabled = false;
                    }
                } else {
                    this.sendSettings('{"relay_value":{"value":1}}');
                }
            }
            $.get(PLUGIN_BASEURL  + 'fusibox/settings');
        });

        $("#fan-button").click(e => {
            e.target.disabled = true;
            if (this.settings['fan_mode'] && this.settings['fan_mode']['value'] == 'timer') {
                this.sendSettings('{"fan_timeout":{"started":' + ((new Date()).getTime() * (Number(Number(this.outputs['fan_1']['value']) || Number(this.outputs['fan_2']['value'])) * 0.1 || 1) / 1000) + '}}');
                
            } else {
                if (Number(this.outputs['fan_1']['value']) || Number(this.outputs['fan_2']['value'])) {
                    this.sendSettings('{"fan_value":{"value":0}}');
                } else {
                    this.sendSettings('{"fan_value":{"value":1}}');
                }
            }
            $.get(PLUGIN_BASEURL  + 'fusibox/settings');
        });

        this.refreshFiles = () => {
            fetch(PLUGIN_BASEURL + 'fusibox/file/list')
                .then(data => data.json())
                .then(data => {
                    let noData = true;
                    $('#files-container tbody').html('');
                    for (image of data.images) {
                        $('#files-container tbody').append('<tr>' +
                            '<td><input type="checkbox" class="file" id="file|image|' + image.name + '"></td>' +
                            '<td><a href="' + PLUGIN_BASEURL + 'fusibox/file?type=image&name=' + image.name + '" target="_blank">' + image.name + '</a></td>' +
                            '<td>' + gettext('Image') + '</td>' +
                            '<td>' + image.size + 'KB</td>');
                        noData = false;
                    }
                    for (video of data.videos) {
                        $('#files-container tbody').append('<tr>' +
                            '<td><input type="checkbox" class="file" id="file|video|' + video.name + '"></td>' +
                            '<td><a href="' + PLUGIN_BASEURL + 'fusibox/file?type=video&name=' + video.name + '" target="_blank">' + video.name + '</a></td>' +
                            '<td>' + gettext('Video') + '</td>' +
                            '<td>' + video.size + 'KB</td>');
                        noData = false;
                    }
                    for (audio of data.audios) {
                        $('#files-container tbody').append('<tr>' +
                            '<td><input type="checkbox" class="file" id="file|audio|' + audio.name + '"></td>' +
                            '<td><a href="' + PLUGIN_BASEURL + 'fusibox/file?type=audio&name=' + audio.name + '" target="_blank">' + audio.name + '</a></td>' +
                            '<td>' + gettext('Audio') + '</td>' +
                            '<td>' + audio.size + 'KB</td>');
                        noData = false;
                    }
    
                    if (noData) {
                        document.getElementById('files-container-all').style.display = 'none';
                    } else {
                        document.getElementById('files-container-all').style.display = 'block';
                    }
                });
        }
    
        this.deleteFiles = () => {
            filesToDelete = Array.from(document.querySelectorAll('[id^="file|"]:checked')).map(item => {
                return {
                    type: item.id.split('|')[1],
                    name: item.id.split('|')[2]
                }
            });
    
            if (confirm('Are you sure?')) {
                $.ajax({
                    method: 'POST',
                    url: PLUGIN_BASEURL + 'fusibox/file/delete', 
                    data: JSON.stringify({ files: filesToDelete }),
                    contentType: 'application/json'
                }).done(data => {
                    if (data.result) this.refreshFiles();
                });
            }
        }
    
        this.refreshFiles();

        this.onBeforeWizardFinish = () => {   
            if (!$("#wizard_plugin_fusibox").length) {
                return;
            }
            
            new PNotify({
                title: gettext('Restart needed!'),
                text: gettext('FusiBox configuration complete. You will need to restart your Pi for the changes to take effect.'),
                type: 'success',
                hide: false,
            });
        };

        this.setupInProgress = ko.observable(false);
        this.setupCompleted = ko.observable(false);

        this.runConfigTest = () => {
            console.log("Starting fusibox requirements setup...");
            this.setupInProgress(true);
            this.setupCompleted(false);

            $.get(PLUGIN_BASEURL + 'fusibox/setup/start');
        }
    }

    // This is how our plugin registers itthis with the application, by adding some configuration
    // information to the global variable OCTOPRINT_VIEWMODELS
    OCTOPRINT_VIEWMODELS.push({
        // This is the constructor to call for instantiating the plugin
        construct: FusiBoxViewModel,
        dependencies: ['settingsViewModel']
    });

    
});