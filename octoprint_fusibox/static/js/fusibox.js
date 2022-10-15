let FusiBox;
$(function() {
    function FusiBoxViewModel(parameters) {
        FusiBox = this;
        this.settings = parameters[0];

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

        $('#panelMode').change(this.onChangePanelMode);
        $('#relayMode').change(this.onChangeRelayMode);
        $('#fanMode').change(this.onChangeFanMode);

        this.onSettingsShown = () => {
            $('#panelMode').change();
            $('#relayMode').change();
            $('#fanMode').change();
        }
        
        this.settings = {};
        this.sensors = {};
        this.outputs = {};
        
        $('document').ready(() => {
            this.fusiboxSocketClient = new WebSocket('ws://' + location.hostname + ':8765');
            this.fusiboxSocketClient.onopen = () => {
                setInterval(() => {
                    this.fusiboxSocketClient.send('outputs');
                    this.fusiboxSocketClient.send('sensors');
                }, 1000);
                
                this.fusiboxSocketClient.send('settings');
                setInterval(() => {
                    this.fusiboxSocketClient.send('settings');
                }, 2000);
            }
            this.fusiboxSocketClient.onmessage = e => {
                try {
                    let data = e.data.split('**').shift();
                    let obj = e.data.split('**').pop();
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
                                $('#fan-button').attr('title', 'Controlled by schedule (' + this.settings['fan_schedule']['start'] + ' -> ' + this.settings['fan_schedule']['end'] + ' - ' + this.settings['fan_schedule']['days'].sort() + ')');
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
                                $('#power-button').attr('title', 'Controlled by schedule (' + this.settings['relay_schedule']['start'] + ' -> ' + this.settings['relay_schedule']['end'] + ' - ' + this.settings['relay_schedule']['days'].sort() + ')');
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
                        if (Number(obj['fan_1']['value'])) {
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
                            $('#camera-container img').attr('src', 'http://' + location.hostname + ':8000/video-feed');
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
                            $('#mic-container audio').attr('src', 'http://' + location.hostname + ':8000/audio-feed');
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
                } catch (err) {
                    console.log('FUSIBOX', err);
                }
            }
        });

        $("#camera-button").click(e => {
            e.target.disabled = true;
            if (Number(this.settings['camera']['value'])) {
                this.fusiboxSocketClient.send('{"camera":{"value":0}}');
            } else {
                this.fusiboxSocketClient.send('{"camera":{"value":1}}');
            }
            this.fusiboxSocketClient.send('settings');
        });

        $("#camera-action-image").click(e => {
            window.open('http://' + location.hostname + ':' + 8000 + '/image-feed', '_blank');
            refreshFiles();
        });

        $("#camera-action-video").click(e => {
            if (e.target.style.color == "red") {
                e.target.style.color = "black";
                fetch('http://localhost:8000/video/recording/stop');
                setTimeout(() => refreshFiles(), 2000);
            } else {
                fetch('http://localhost:8000/video/recording/start');
                e.target.style.color = "red";
            }
        });

        $("#mic-action-audio").click(e => {
            if (e.target.style.color == "red") {
                e.target.style.color = "black";
                fetch('http://localhost:8000/audio/recording/stop');
                setTimeout(() => refreshFiles(), 2000);
            } else {
                fetch('http://localhost:8000/audio/recording/start');
                e.target.style.color = "red";
            }
        });

        $("#mic-button").click(e => {
            e.target.disabled = true;
            if (Number(this.settings['mic']['value'])) {
                this.fusiboxSocketClient.send('{"mic":{"value":0}}');
            } else {
                this.fusiboxSocketClient.send('{"mic":{"value":1}}');
            }
            this.fusiboxSocketClient.send('settings');
        });

        $("#light-button").click(e => {
            e.target.disabled = true;
            if (Number(this.outputs['led_panel']['value'])) {
                this.fusiboxSocketClient.send('{"panel_value":{"value":0}}');
            } else {
                this.fusiboxSocketClient.send('{"panel_value":{"value":1}}');
            }
            this.fusiboxSocketClient.send('settings');
        });

        $("#power-button").click(e => {
            e.target.disabled = true;
            if (this.settings['relay_mode'] && this.settings['relay_mode']['value'] == 'timer') {
                this.fusiboxSocketClient.send('{"relay_timeout":{"started":' + ((new Date()).getTime() * (Number(this.outputs['relay_1']['value']) * 0.1 || 1) / 1000) + '}}');
            } else {
                if (Number(this.outputs['relay_1']['value'])) {
                    this.fusiboxSocketClient.send('{"relay_value":{"value":0}}');
                } else {
                    this.fusiboxSocketClient.send('{"relay_value":{"value":1}}');
                }
            }
            this.fusiboxSocketClient.send('settings');
        });

        $("#fan-button").click(e => {
            e.target.disabled = true;
            if (this.settings['fan_mode'] && this.settings['fan_mode']['value'] == 'timer') {
                this.fusiboxSocketClient.send('{"fan_timeout":{"started":' + ((new Date()).getTime() * (Number(this.outputs['fan_1']['value']) * 0.1 || 1) / 1000) + '}}');
            } else {
                if (Number(this.outputs['fan_1']['value'])) {
                    this.fusiboxSocketClient.send('{"fan_value":{"value":0}}');
                } else {
                    this.fusiboxSocketClient.send('{"fan_value":{"value":1}}');
                }
            }
            this.fusiboxSocketClient.send('settings');
        });

    }

    // This is how our plugin registers itthis with the application, by adding some configuration
    // information to the global variable OCTOPRINT_VIEWMODELS
    OCTOPRINT_VIEWMODELS.push({
        // This is the constructor to call for instantiating the plugin
        construct: FusiBoxViewModel
    });
});