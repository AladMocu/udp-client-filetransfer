const WebSocket = require("ws");
const fs = require("fs");
const pathM = require('path');
var dgram = require('dgram');
var server = dgram.createSocket('udp4');

const { exec } = require("child_process");

const path = pathM.resolve("./files");
const logs=pathM.resolve("./logs/server");
const clients = [];
const files=[];
const queue=[];




// check for os and junk file generation
if(process.platform==="win32")
{
    if(!fs.existsSync("./files/junk100mb.dat"))
    {
        
        exec("fsutil file createnew ./files/junk100mb.dat 104857600")   //fsutil win size in bytes

    }
    if(!fs.existsSync("./files/junk250mb.dat"))
    {
        exec("fsutil file createnew ./files/junk250mb.dat 262144000")
    }
}
else
{
    if(!fs.existsSync("./files/junk100mb.dat"))
    {
        exec("dd if=/dev/zero of=./files/junk100mb.dat  bs=100M  count=1")  //fsutil unix size in Mb
    }
    if(!fs.existsSync("./files/junk250mb.dat"))
    {
        exec("dd if=/dev/zero of=./files/junk250mb.dat  bs=250M  count=1")
    }
}


  const wss = new WebSocket.Server({ port:3000 });

  wss.on("connection", (ws,req,client) => 
  {
    clients.push({socket:ws,IP:req.socket.remoteAddress});
    greet(ws);
    currentUsers();
    
    
    ws.on("close",()=>
    {
      let client2Remove = clients.filter(c=>c.socket===ws)[0];
      clients.splice(clients.indexOf(client2Remove),1);
      
      currentUsers();
    });

    ws.on("message", (message) =>
    {
      let msg = JSON.parse(message);
      if(msg.type  === "connection")
      {
        for(let i=0;i<clients.length;i++)
        {
          if(ws==clients[i].socket)
          {
            clients[i].UDPport = msg.port
            checkQueue();
          }
        }
      }
      if(msg.type  === "bye")
      {
        for(let i=0;i<clients.length;i++)
        {
          if(ws==clients[i].socket)
          {
           // clients.re clients[i]
            clients.splice(i,1)
            currentUsers();
          }
        }
      }
      else if(msg.type  === "request")
      {
          
        fs.exists((path+"/"+msg.name),(ans)=>
        {
            if(!ans) return ws.send(JSON.stringify({type:"error",content:`File ${msg.name} doesn´t exist`}));
            queue.push({name:msg.name,users:msg.users});
            checkQueue();
        });
      }
      
    });
  });
  const currentUsers=()=>{
    clients.forEach((client)=>
    {
      client.socket.send(JSON.stringify({type:"count",content:clients.length}));
    });
  };
  const greet=(ws)=>
  {
    
    resp={type:"greet",content:files};
    ws.send(JSON.stringify(resp));
  }
  const checkQueue=()=>{
    let users=clients.length;
    let toRemove=[];
    queue.forEach((process)=>{
      if(process.users<=users)
      {
        toRemove.push(process);
        sendFile(process);
      }
    });
    toRemove.forEach((process)=>{
      queue.splice(queue.indexOf(process),1);
    });
  };
  function hashCode(info)
  {
    var hash=0;
    for(var i =0;i<info.length;i++)
    {
      var character = info.charCodeAt(i);
      hash = ((hash<<5)-hash)+character;
      hash = hash & hash;
    }
    return hash;
  }
  const logger=(newLog)=>{
    const dateLog=new Date();
    const fileName=`${logs}\\${dateLog.getFullYear()}-${dateLog.getMonth()}-${dateLog.getDay()}-${dateLog.getMinutes()}-${dateLog.getSeconds()}-log.txt`;
    fs.writeFile(fileName,JSON.stringify(newLog),(err)=>{
      (err) ? console.log(err) : console.log(`New Log: ${fileName}`);
    });
  };
  const sendFile = (process) => 
  {   
    fs.readFile((path+"/"+process.name),(err,data)=>
    {
        if(err)
        {
            console.log("Error");
            return;
        }
        let filesize = (fs.statSync(path+"/"+process.name).size);

        const encodedData = new Buffer.from(data,"binary").toString('base64');
        const chunkdata = encodedData.match(/.{1,65000}/g)
        const hashedData =hashCode(encodedData);
        const toLog=[];
        clients.forEach((client) => 
        {   
            if(process.users==0) return;
            const clientInfo={}
            clientInfo.IP=client.IP;
            clientInfo.recibio=false;
            clientInfo.perdio=false;
            udpip=client.IP.split(":")[3]
            process.users-=1;
            const initSend=Date.now();
            try 
            {
              client.socket.send(JSON.stringify({type:"file",content:{name:process.name,/*data:encodedData,*/type:pathM.extname(path+"/"+process.name),validation:hashedData,size:filesize}}));  
            }
            catch (error) 
            {
              console.log(error)
              clientInfo.perdio=true;
            }
            for(let i = 0;i< chunkdata.length;i++)
            {
              try
              {
                
                server.send(chunkdata[i],0,chunkdata[i].length,client.UDPport,udpip,(err,bytes)=>{
                  console.log('UDP to ' + udpip +':'+ client.UDPport);
                  if (err) 
                      throw err;
                  console.log('File size: ' + chunkdata[i].length);
                })
                
                clientInfo.recibio=true;
              }
              catch (error) 
              {
                console.log(error)
                clientInfo.perdio=true;
              }
            }
            const endSend=Date.now();
            clientInfo.diftime=endSend-initSend;
            toLog.push(clientInfo);
            console.log('Sended: ' + chunkdata.length + ' packages');
        });
        logger(toLog);
    });
  };
function loadFileInfo()
{
    const names=fs.readdirSync(path);
    names.forEach((name)=>{
        const size = (fs.statSync(path+"/"+name).size)/1000000;
        files.push({name:name,size:size});
    });
}

loadFileInfo();