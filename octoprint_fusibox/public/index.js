let panel_status = document.getElementById('panel_status');
let panel_camera = document.getElementById('panel_camera');
let panel_mode = document.getElementById('panel_mode');
let panel_value = document.getElementById('panel_value');
let panel_distance = document.getElementById('panel_distance');
let panel_timeout = document.getElementById('panel_timeout');
let panel_save = document.getElementById('panel_save');

let relay_status = document.getElementById('relay_status');
let relay_mode = document.getElementById('relay_mode');
let relay_value = document.getElementById('relay_value');
let relay_schedule_start = document.getElementById('relay_schedule_start');
let relay_schedule_end = document.getElementById('relay_schedule_end');
let relay_weekday_0 = document.getElementById('relay_weekday_0');
let relay_weekday_1 = document.getElementById('relay_weekday_1');
let relay_weekday_2 = document.getElementById('relay_weekday_2');
let relay_weekday_3 = document.getElementById('relay_weekday_3');
let relay_weekday_4 = document.getElementById('relay_weekday_4');
let relay_weekday_5 = document.getElementById('relay_weekday_5');
let relay_weekday_6 = document.getElementById('relay_weekday_6');
let relay_timeout = document.getElementById('relay_timeout');
let relay_save = document.getElementById('relay_save');

let fan_status = document.getElementById('fan_status');
let fan_mode = document.getElementById('fan_mode');
let fan_value = document.getElementById('fan_value');
let fan_temperature_min = document.getElementById('fan_temperature_min');
let fan_temperature_max = document.getElementById('fan_temperature_max');
let fan_schedule_start = document.getElementById('fan_schedule_start');
let fan_schedule_end = document.getElementById('fan_schedule_end');
let fan_weekday_0 = document.getElementById('fan_weekday_0');
let fan_weekday_1 = document.getElementById('fan_weekday_1');
let fan_weekday_2 = document.getElementById('fan_weekday_2');
let fan_weekday_3 = document.getElementById('fan_weekday_3');
let fan_weekday_4 = document.getElementById('fan_weekday_4');
let fan_weekday_5 = document.getElementById('fan_weekday_5');
let fan_weekday_6 = document.getElementById('fan_weekday_6');
let fan_timeout = document.getElementById('fan_timeout');
let fan_save = document.getElementById('fan_save');

let mic_value = document.getElementById('mic_value');
let mic_save = document.getElementById('mic_save');

let camera_value = document.getElementById('camera_value');
let camera_save = document.getElementById('camera_save');

let sensor_temperature = document.getElementById('sensor_temperature');
let sensor_distance = document.getElementById('sensor_distance');
let sensor_humidity = document.getElementById('sensor_humidity');
let sensor_save = document.getElementById('sensor_save');

let client = new WebSocket('ws://localhost:8765');

panel_distance.style.display = 'None';
panel_timeout.style.display = 'None';
panel_mode.onchange = panelmode;
function panelmode() {
    let mode = panel_mode.value;

    if (mode == 'manual') {
        panel_distance.style.display = 'None';
        panel_timeout.style.display = 'None';
        panel_value.style.display = '';
    } else if (mode == 'distance') {
        panel_distance.style.display = '';
        panel_timeout.style.display = '';
        panel_value.style.display = 'None';
    }
}

relay_schedule_start.style.display = 'None';
relay_schedule_end.style.display = 'None';
relay_weekday_0.style.display = 'None';
relay_weekday_1.style.display = 'None';
relay_weekday_2.style.display = 'None';
relay_weekday_3.style.display = 'None';
relay_weekday_4.style.display = 'None';
relay_weekday_5.style.display = 'None';
relay_weekday_6.style.display = 'None';
relay_timeout.style.display = 'None';
relay_mode.onchange = relaymode;
function relaymode() {
    let mode = relay_mode.value;

    if (mode == 'manual') {
        relay_schedule_start.style.display = 'None';
        relay_schedule_end.style.display = 'None';
        relay_weekday_0.style.display = 'None';
        relay_weekday_1.style.display = 'None';
        relay_weekday_2.style.display = 'None';
        relay_weekday_3.style.display = 'None';
        relay_weekday_4.style.display = 'None';
        relay_weekday_5.style.display = 'None';
        relay_weekday_6.style.display = 'None';
        relay_timeout.style.display = 'None';
        relay_value.style.display = '';
    } else if (mode == 'schedule') {
        relay_schedule_start.style.display = '';
        relay_schedule_end.style.display = '';
        relay_weekday_0.style.display = '';
        relay_weekday_1.style.display = '';
        relay_weekday_2.style.display = '';
        relay_weekday_3.style.display = '';
        relay_weekday_4.style.display = '';
        relay_weekday_5.style.display = '';
        relay_weekday_6.style.display = '';
        relay_timeout.style.display = 'None';
        relay_value.style.display = 'None';
    } else if (mode == 'timer') {
        relay_schedule_start.style.display = 'None';
        relay_schedule_end.style.display = 'None';
        relay_weekday_0.style.display = 'None';
        relay_weekday_1.style.display = 'None';
        relay_weekday_2.style.display = 'None';
        relay_weekday_3.style.display = 'None';
        relay_weekday_4.style.display = 'None';
        relay_weekday_5.style.display = 'None';
        relay_weekday_6.style.display = 'None';
        relay_timeout.style.display = '';
        relay_value.style.display = 'None';
    }
}

fan_schedule_start.style.display = 'None';
fan_schedule_end.style.display = 'None';
fan_weekday_0.style.display = 'None';
fan_weekday_1.style.display = 'None';
fan_weekday_2.style.display = 'None';
fan_weekday_3.style.display = 'None';
fan_weekday_4.style.display = 'None';
fan_weekday_5.style.display = 'None';
fan_weekday_6.style.display = 'None';
fan_timeout.style.display = 'None';
fan_temperature_max.style.display = 'None';
fan_temperature_min.style.display = 'None';
fan_mode.onchange = fanmode;
function fanmode() {
    let mode = fan_mode.value;

    if (mode == 'manual') {
        fan_schedule_start.style.display = 'None';
        fan_schedule_end.style.display = 'None';
        fan_weekday_0.style.display = 'None';
        fan_weekday_1.style.display = 'None';
        fan_weekday_2.style.display = 'None';
        fan_weekday_3.style.display = 'None';
        fan_weekday_4.style.display = 'None';
        fan_weekday_5.style.display = 'None';
        fan_weekday_6.style.display = 'None';
        fan_timeout.style.display = 'None';
        fan_value.style.display = '';
        fan_temperature_max.style.display = 'None';
        fan_temperature_min.style.display = 'None';
    } else if (mode == 'schedule') {
        fan_schedule_start.style.display = '';
        fan_schedule_end.style.display = '';
        fan_weekday_0.style.display = '';
        fan_weekday_1.style.display = '';
        fan_weekday_2.style.display = '';
        fan_weekday_3.style.display = '';
        fan_weekday_4.style.display = '';
        fan_weekday_5.style.display = '';
        fan_weekday_6.style.display = '';
        fan_timeout.style.display = 'None';
        fan_value.style.display = 'None';
        fan_temperature_max.style.display = 'None';
        fan_temperature_min.style.display = 'None';
    } else if (mode == 'timer') {
        fan_schedule_start.style.display = 'None';
        fan_schedule_end.style.display = 'None';
        fan_weekday_0.style.display = 'None';
        fan_weekday_1.style.display = 'None';
        fan_weekday_2.style.display = 'None';
        fan_weekday_3.style.display = 'None';
        fan_weekday_4.style.display = 'None';
        fan_weekday_5.style.display = 'None';
        fan_weekday_6.style.display = 'None';
        fan_timeout.style.display = '';
        fan_value.style.display = 'None';
        fan_temperature_max.style.display = 'None';
        fan_temperature_min.style.display = 'None';
    } else if (mode == 'temperature') {
        fan_schedule_start.style.display = 'None';
        fan_schedule_end.style.display = 'None';
        fan_weekday_0.style.display = 'None';
        fan_weekday_1.style.display = 'None';
        fan_weekday_2.style.display = 'None';
        fan_weekday_3.style.display = 'None';
        fan_weekday_4.style.display = 'None';
        fan_weekday_5.style.display = 'None';
        fan_weekday_6.style.display = 'None';
        fan_timeout.style.display = 'None';
        fan_value.style.display = 'None';
        fan_temperature_max.style.display = '';
        fan_temperature_min.style.display = '';
    }
}

mic_save.onclick = e => {
    client.send('{"mic":{"value":' + Number(mic_value.checked) + '}}');
    client.send('settings');
    if (mic_value.checked) {
        document.getElementById('mic_content').innerHTML = '<audio controls="controls" src="http://localhost:8000/audio_feed" type="audio/x-wav;codec=pcm">';
    } else {
        document.getElementById('mic_content').children[0].src = '';
        document.getElementById('mic_content').innerHTML = '';
    }
}

camera_save.onclick = e => {
    client.send('{"camera":{"value":' + Number(camera_value.checked) + '}}');
    client.send('settings');
    if (camera_value.checked) {
        document.getElementById('camera_content').innerHTML = '<img src="http://localhost:8000/video_feed">';
    } else {
        document.getElementById('camera_content').children[0].src = '';
        document.getElementById('camera_content').innerHTML = '';
    }
}

panel_save.onclick = e => {
    let mode = panel_mode.value;
    
    switch(mode) {
        case 'manual':
            client.send('{"panel_value":{"value":' + Number(panel_value.checked) + '}}');
            break;
        case 'distance':
            client.send('{"panel_distance":{"value":"' + panel_distance.value + '"}}');
            client.send('{"panel_timeout":{"value":' + panel_timeout.value + '}}');
            break;
    }
    client.send('{"panel_camera":{"value":' + Number(panel_camera.checked) + '}}');
    client.send('{"panel_mode":{"value":"' + mode + '"}}');
    client.send('settings');
}

relay_save.onclick = e => {
    let mode = relay_mode.value;
    
    switch(mode) {
        case 'manual':
            client.send('{"relay_value":{"value":' + Number(relay_value.checked) + '}}');
            break;
        case 'schedule':
            let weedays = Array.from(document.querySelectorAll('[id^=relay_weekday_]')).map(item => item.checked ? Number(item.id.split('_').pop()) : '').filter(item => item !== '');
            client.send('{"relay_schedule":{"start":"' + relay_schedule_start.value + '","end":"' + relay_schedule_end.value + '","days":[' + weedays + ']}}');
            break;
        case 'timer':
            client.send('{"relay_timeout":{"value":' + relay_timeout.value + ',"started":0}}');
            break;
    }
    client.send('{"relay_mode":{"value":"' + mode + '"}}');
    client.send('settings');
}

fan_save.onclick = e => {
    let mode = fan_mode.value;
    
    switch(mode) {
        case 'manual':
            client.send('{"fan_value":{"value":' + Number(fan_value.checked) + '}}');
            break;
        case 'temperature':
            client.send('{"fan_temperature":{"min":' + Number(fan_temperature_min.value) + ',"max":' + Number(fan_temperature_max.value) + '}}');
            break;
        case 'schedule':
            let weedays = Array.from(document.querySelectorAll('[id^=fan_weekday_]')).map(item => item.checked ? Number(item.id.split('_').pop()) : '').filter(item => item !== '');
            client.send('{"fan_schedule":{"start":"' + fan_schedule_start.value + '","end":"' + fan_schedule_end.value + '","days":[' + weedays + ']}}');
            break;
        case 'timer':
            client.send('{"fan_timeout":{"value":' + fan_timeout.value + ',"started":0}}');
            break;
    }
    client.send('{"fan_mode":{"value":"' + mode + '"}}');
    client.send('settings');
}

sensor_save.onclick = e => {
    client.send('{"temperature":{"value":' + sensor_temperature.value + '}}');
    client.send('{"distance":{"value":' + sensor_distance.value + '}}');
    client.send('{"humidity":{"value":' + sensor_humidity.value + '}}');
    client.send('settings');
}

client.onmessage = e => {
    try {
        let data = e.data.split('**').shift();
        let obj = e.data.split('**').pop();
        obj = JSON.parse(obj);
        
        if (data == 'outputs') {
            panel_status.innerHTML = Number(obj.led_panel.value) ? 'ON' : 'OFF';
            relay_status.innerHTML = Number(obj.relay_1.value) ? 'ON' : 'OFF';
            fan_status.innerHTML = Number(obj.fan_1.value) ? 'ON' : 'OFF';
        }
        
        if (data == 'sensors') {
            sensor_temperature.value = obj.temperature.value;
            sensor_distance.value = obj.distance.value;
            sensor_humidity.value = obj.humidity.value;
        }
        
        if (data == 'settings') {
            camera_value.checked = Number(obj.camera.value) == 1;
            mic_value.checked = Number(obj.mic.value) == 1;

            panel_mode.value = obj.panel_mode.value;
            panel_camera.checked = Number(obj.panel_camera.value) == 1;
            panel_distance.value = obj.panel_distance.value;
            panel_timeout.value = obj.panel_timeout.value;
            panel_value.checked = Number(obj.panel_value.value) == 1;
            
            fan_mode.value = obj.fan_mode.value;
            fan_schedule_start.value = obj.fan_schedule.start;
            fan_schedule_end.value = obj.fan_schedule.end;
            Array.from(document.querySelectorAll('[id^=fan_weekday_]')).forEach((item, index) => item.checked = obj.fan_schedule.days.indexOf(index) !== -1);
            fan_temperature_min.value = obj.fan_temperature.min;
            fan_temperature_max.value = obj.fan_temperature.max;
            fan_timeout.value = obj.fan_timeout.value;
            fan_value.checked = Number(obj.fan_value.value) == 1;


            relay_mode.value = obj.relay_mode.value;
            relay_schedule_end.value = obj.relay_schedule.end;
            Array.from(document.querySelectorAll('[id^=relay_weekday_]')).forEach((item, index) => item.checked = obj.relay_schedule.days.indexOf(index) !== -1);
            relay_timeout.value = obj.relay_timeout.value;
            relay_value.checked = Number(obj.relay_value.value) == 1;

            fanmode();
            relaymode();
            panelmode();
            console.log(obj);
        }
    } catch (err) {}
}

client.onopen = () => {
    setInterval(() => {
        client.send('outputs');
        client.send('sensors');
    }, 1000);
    
    client.send('settings');
}
