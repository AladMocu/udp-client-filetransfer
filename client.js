var blessed = require('blessed');
const dgram = require('dgram');
const WebSocket = require('ws');

let archivos = []
let uscount = 1 ;
var screen = blessed.screen({
    smartCSR: true
});

var client = dgram.createSocket('udp4');
let sv = "localhost:3000"



const ws = new WebSocket(`ws://${sv}`);

// WEB INTERACTIONS
ws.on('open',function open(){
	box.content = "{center}Conexion Exitosa!{/center}"
    box.style.bg = "green"
	print('Conectado');
	screen.render();
})

ws.on('message',function incoming(data){
	print('Se recibio: '+ data);
	var jdata=  JSON.parse(data);
	if (jdata.type==="greet")
	{
		if(jdata.content)
		{
			for(let i=0;i<jdata.content.length;i++)
			{
				t= jdata.content[i]
				archivos.push(`${t.name}\t ${t.size}Mb`)
			}
			loadFiles();
			filesUI.append(submit)
			screen.render();
		}
		
	}
	else if (jdata.type==="error")
	{
		print(jdata.content)
	}
	else if (jdata.type==="count")
	{
		uscount = jdata.content
		
		updateUsers(uscount)
		screen.render();
	}
})
ws.on('close', function close() {
	print('Desconectado');
});
client.on('message', function (message, remote) {
    wstream.write(message);
    wstream.end();
});




screen.title = 'UDP Client';
conectionStatus = `{center}Conectando a {bold} ${sv}{/bold}! {/center}`

// Create a box perfectly centered horizontally and vertically.
var box = blessed.box({
    parent: screen,
    top: 0,
    left: 'center',
    width: '50%',
    height: '10%',
    content: conectionStatus,
    tags: true,
    border: {
        type: 'line'
    },
    style: {
        fg: 'white',
        bg: 'magenta',
        border: {
            fg: '#f0f0f0'
        },
        hover: {
            bg: 'green'
        }
    }
});
var uname = blessed.box({
    top: 0,
    left: 0,
    width: "20%",
    height: " 10%",
    content: "{center} Cliente UDP {/center}",
    tags: true,
    border: {
        type: 'line'
    },
});
var ucount = blessed.box({
    screen: screen,
    top: 0,
    right: 0,
    width: "20%",
    height: " 10%",
    content: "Usuarios Activos: "+ucount,
    border: {
        type: 'line'
    },
});
var filesUI = blessed.form({
    top: "12%",
    bottom: 10,
    parent: screen,
    mouse: false,
    keys: true,
    vi: true,
    border: {
        type: 'line'
    },
});
var logUI = blessed.box({
    parent: screen,
    bottom: 0,
    right: 0,
    height: " 10%",
    content: "",
    border: {
        type: 'line'
    },
});
var radioset = blessed.radioset({
	parent: filesUI,
  });

function loadFiles() {
    for (let i = 0; i < archivos.length; i++) {
        let r = blessed.radiobutton({
			parent: radioset,
            name: "files",
            content: archivos[i],
            top: 5 * i,
			focused: true,
			checked:i==0?true:false

        })
    }
}


function updateUsers(uCount) {
    ucount.content = `Usuarios Activos: ${uCount}`
}
// Append our box to the screen.
screen.append(box);
screen.append(uname)

var submit = blessed.button({
	screen: screen,
    name: 'submit',
    content: 'Solicitar Descarga',
    top: 35,
    left: 5,
    shrink: true,
	focused: false,
	mouse:true,
    padding: {
        top: 1,
        right: 2,
        bottom: 1,
        left: 2
    },
    style: {
        bold: true,
        fg: 'white',
        bg: 'green',
		focus: {
			inverse: true
		  }
    },
});


submit.on('press', function() {

    filesUI.submit();
});

filesUI.on('submit', function(data) {
	let ind =-((JSON.stringify(data.files).match(/,/g)||[]).length)+archivos.length-1
	print("Se solicito el archivo:" + archivos[ind]);
	download(archivos[ind])
    screen.render();
});
// Quit on Escape, q, or Control-C.
screen.key(['escape', 'q', 'C-c'], function(ch, key) {
    return process.exit(0);
});

// Render the screen.

screen.append(ucount)
//PRUEBAS SIN SERVIDOR
alert = blessed.message({
	left: 'center',
	top: 'center',
	height: 'shrink',
	width: 'shrink',
	border: 'line',
	hidden:true,
	style: {
	  fg: 'blue',
	  bg: 'black',
	  bold: true,
	  border: {
		fg: 'blue',
		bg: 'red'
	  }
	}
});
screen.append(alert);

askUsersUI = blessed.prompt({
	left: 'center',
	top: 'center',
	height: 'shrink',
	width: 'shrink',
	border: 'line',
	hidden:true,
	style: {
	  fg: 'blue',
	  bg: 'black',
	  bold: true,
	  border: {
		fg: 'blue',
		bg: 'red'
	  }
	}
});
screen.append(askUsersUI);

function download(file){
	// esperar al servidor 
	askUsersUI.input("¿Para cuantos usuarios desea descargar?",'1',(err,users)=>
	{
		req ={
			archivo: file.split("\t")[0],
			usuarios: users
		};
		//askUsersUI.hidden=true;
		print(JSON.stringify(req))
		screen.render();
		//ws.send(JSON.stringify(req))
	});
	screen.render();
}
screen.render();
function print(log){
	logUI.content = log+"";
}