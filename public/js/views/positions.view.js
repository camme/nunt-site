(function(nunt) {

    var mouse = {x: -1, y: -1};
    var mouseOld = {x: -1, y: -1};
    var clientCount = 0;
    var clients = {};
    var clientsDots = {};
    var clientsDotsCount = 0;
    var paper1;

    nunt.on(nunt.CONNECTED, begin);
    nunt.on(nunt.READY, init);

    nunt.on("client.mouse.move", showOtherClientsMove);
    nunt.on("client.connected", showClientConnected);
    nunt.on("twitter.update.stats", showTwitter);
    nunt.on("twitter.connected", showClientConnected);

    $(document).mousemove(function(e){
        mouse.x = e.pageX;
        mouse.y = e.pageY;
    }); 


    function init()
    {
        var width = $("#canvas1").width();
        var height = $("#canvas1").height();
        paper1 = Raphael("canvas1", 570, height);
    }


    function begin()
    {
        // begin to ready the maouse corrdinates
        setInterval(readMouse, 100);
    }

    function showTwitter(e) {
        console.log(paper1);

        var colors = ["#666666", "#888888", "#AAAAAA"];

        paper1.clear();
        for(var date in e.stats) {
            var stats = e.stats[date];
            var counter = 0;;
            for(var hashtags in stats) {
                var count = stats[hashtags];
                var circle = paper1.circle(570/2, 346/2, 5).animate({r: count * 3 * 20, opacity: 0} , 50000);
                circle.attr({'stroke-width': count * 3, stroke: colors[counter]});
                counter++;
            }
        }
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
            domItem = $("<div class='mouseDot'><div class='innerDot'><div class='info'>Test</div></div></div>");
            if (e.sessionId.indexOf(e.clientId) != -1) {
                domItem.find(".info").html("This is you! All other dots are other clients...");
            }
            else {
                domItem.find(".info").html("This dot is someone elses. Just another client connected at the same time as you!");
            }
            $(document.body).append(domItem);
            domItem.attr("id", "mouseDot-" + e.clientId);
            var c = clientCount * 3 + 150;
            domItem.css({backgroundColor: "rgb(" + c + "," + c + "," + c + ")"});
        }

        domItem.css({left: e.mouse.x - 8});


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
