(function(nunt) {

    var mouse = {x: -1, y: -1};
    var mouseOld = {x: -1, y: -1};
    var clientCount = 0;
    var clients = {};
    var clientsDots = {};
    var clientsDotsCount = 0;

    nunt.on(nunt.CONNECTED, begin);
    nunt.on("client.mouse.move", showOtherClientsMove);
    nunt.on("client.connected", showClientConnected);

    $(document).mousemove(function(e){
        mouse.x = e.pageX;
        mouse.y = e.pageY;
    }); 

    function begin()
    {
        // begin to ready the maouse corrdinates
        setInterval(readMouse, 100);
    }

    function readMouse()
    {
        if (mouseOld.x != mouse.x || mouseOld.y != mouse.y) {
            nunt.send("client.mouse", mouse);
            mouseOld.x = mouse.x;
            mouseOld.y = mouse.y;
        }
    }

    function showOtherClientsMove(e) {

        var domItem = $("#mouseDot-" + e.clientId);
        if (!clients[e.clientId]) {
            clients[e.clientId] = e.clientId;
            clientCount++;
            domItem = $("<div class='mouseDot'></div>");
            $(document.body).append(domItem);
            domItem.attr("id", "mouseDot-" + e.clientId);
            var c = clientCount * 3;
            domItem.css({backgroundColor: "rgb(" + c + "," + c + "," + c + ")"});
        }

        domItem.css({left: e.mouse.x});


    }

    function showClientConnected(e) {
        var domItem = $("#clientDot-" + e.clientId);
        if (!clientsDots[e.clientId]) {
            clientsDots[e.clientId] = e.clientId;
            clientsDotsCount++;
            domItem = $("<div class='clientDot'></div>");
            $(document.body).append(domItem);
            domItem.attr("id", "clientDot-" + e.clientId);
            var c = clientsDotsCount * 3;
            setTimeout(function() {
                domItem.css({backgroundColor: "rgb(" + c + "," + c + "," + c + ")", top: 0});
            }, 500);
        }
    }

})(nunt);
