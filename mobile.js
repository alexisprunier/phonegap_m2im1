var myApplication = {
    successHandler: function(result) {
        $("#logging").append('Callback Success! Result = ' + result)
    },
    errorHandler:function(error) {
        $("#logging").append(error);
    },
    onNotificationGCM: function (e) {
        switch (e.event) {
            case 'registered':
                if (e.regid.length > 0) {
                    $("#logging").append('registration id = ' + e.regid);
                }
                break;
            case 'message':
                $("#logging").append('message = ' + e.message + ' msgcnt = ' + e.msgcnt);
                break;
            case 'error':
                $("#logging").append('GCM error = ' + e.msg);
                break;
            default:
                $("#logging").append('An unknown GCM event has occurred');
                break;
        }
    }
};
var wsRequester = {};

	
(function($){

    myApplication.actions = [];
    myApplication.url = "http://ypap.azurewebsites.net/";
    myApplication.connectedUser = null;

    // EVENTS IMPLEMENTATION
	
    document.addEventListener("deviceready", onDeviceReady, false);

    $(document).on("click", ".el_navbar", function (event) {
        myApplication.feedContent($(this).attr("id"));
        myApplication.showPage($(this).attr("id"), false);
    });

    $(document).on("click", ".available_detail", function (event) {
        myApplication.showDetail($(this).attr("event"));
    });

    $(document).on("click", ".detail_event_cl", function (event) {
        myApplication.hideDetail();
    });

    $(document).on("click", ".available_parti,.myevent_detail", function (event) {
        wsRequester.takePartToAnEvent(myApplication.successHandler,
                                   myApplication.errorHandler,
                                   $(this).attr("event"));
        wsRequester.getAvailableEvents(myApplication.successHandler,
                                       myApplication.errorHandler);
    });

    $(document).on("click", "#pseudo_button", function (event) {
        wsRequester.isUserExisting(myApplication.successHandler,
                                   myApplication.errorHandler,
                                   $("#pseudo_field").val());
    });
	
    function onDeviceReady() {
        myApplication.showPage("el_connexion", true);
        var pushNotification = window.plugins.pushNotification;
        pushNotification.register(myApplication.successHandler,
                                  myApplication.errorHandler,
                                  { "senderID": "334799251298", "ecb": "myApplication.onNotificationGCM" });
        
        //google.load("maps", "3.8", { "callback": map, other_params: "sensor=true&language=en" });
    }

    function onBackButton(){
        myApplication.showPage(myApplication.actions.pop(), true);
        if(myApplication.actions.length===0){
            document.removeEventListener("backbutton");
        }
    }

    // MYAPPLICATION IMPLEMENTATION 
	
    myApplication.showPage = function (pageId, doNotShowInHistory) {
        $.mobile.loading('show')
        $(".page").hide();
        var element = pageId.split("_")[1];
        $("#" + element).show(200);
        if(doNotShowInHistory != true){
            myApplication.actions.push(pageId);
            //document.addEventListener("backbutton",onBackButton,false);
        }
        $.mobile.loading('hide')
    };

    myApplication.showDetail = function (eventId) {
        $("#detail_event").show();
        $.mobile.loading('hide')
    };

    myApplication.hideDetail = function () {
        $("#detail_event").hide();
    };

    myApplication.feedContent = function (pageId, doNotShowInHistory) {
        if (pageId == "el_accueil") {
            wsRequester.getNextEvent(myApplication.successHandler,
                                   myApplication.errorHandler);
        }
        if(pageId == "el_details"){
            //var container = $("#det_content");
            //container.empty();
        }
        if(pageId == "el_souscrits"){
            wsRequester.getMyEvents(myApplication.successHandler,
                                   myApplication.errorHandler);
        }
        if(pageId == "el_autres"){
            wsRequester.getAvailableEvents(myApplication.successHandler,
                                           myApplication.errorHandler);
        }
    };

    // GOOGLE MAP IMPLEMENTATION

    function map() {
        var latlng = new google.maps.LatLng(55.17, 23.76);
        var myOptions = {
            zoom: 6,
            center: latlng,
            streetViewControl: true,
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            zoomControl: true
        };
        map = new google.maps.Map(document.getElementById("map"), myOptions);

        google.maps.event.addListenerOnce(map, 'tilesloaded', function () {
            watchID = navigator.geolocation.watchPosition(geo_success, geo_error, { maximumAge: 5000, timeout: 5000, enableHighAccuracy: true });
        });
    }

    function geo_error(error) {
        alert('code: ' + error.code + '\n' + 'message: ' + error.message + '\n');
    }

    function geo_success(position) {

        map.setCenter(new google.maps.LatLng(position.coords.latitude, position.coords.longitude));
        map.setZoom(15);

        var info =
        ('Latitude: ' + position.coords.latitude + '<br>' +
        'Longitude: ' + position.coords.longitude + '<br>' +
        'Altitude: ' + position.coords.altitude + '<br>' +
        'Accuracy: ' + position.coords.accuracy + '<br>' +
        'Altitude Accuracy: ' + position.coords.altitudeAccuracy + '<br>' +
        'Heading: ' + position.coords.heading + '<br>' +
        'Speed: ' + position.coords.speed + '<br>' +
        'Timestamp: ' + new Date(position.timestamp));

        var point = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
        if (!marker) {
            //create marker
            marker = new google.maps.Marker({
                position: point,
                map: map
            });
        } else {
            //move marker to new position
            marker.setPosition(point);
        }
        if (!infowindow) {
            infowindow = new google.maps.InfoWindow({
                content: info
            });
        } else {
            infowindow.setContent(info);
        }
        google.maps.event.addListener(marker, 'click', function () {
            infowindow.open(map, marker);
        });
    }

    // REQUESTER IMPLEMENTATION

    wsRequester.isUserExisting = function (success, error, name) {
        var url = myApplication.url + "user/exists?name=" + name;
        $.ajax({
            url: url,
            type: 'GET',
            dataType: 'json',
            data: {"name": name},
            success: function (data) {
                if (success) {
                    if (data != false) {
                        $("#connexion").hide();
                        myApplication.connectedUser = data['Id'];
                        myApplication.showPage("el_accueil", true);
                        myApplication.feedContent("el_accueil");
                    } else {
                        $("#pseudo_message").html("Pseudonyme Inconnu au Bataillon !");
                    }
                    success(data);
                }
            },
            error: function () {
                if (error) {
                    error();
                }
            }
        });
        $.mobile.loading('hide')
    }

    wsRequester.getNextEvent = function (success, error) {
        url = myApplication.url + "event/getNextFuturEventByRegistration?iduser=" + myApplication.connectedUser;
        $.ajax({
            url: url,
            type: 'GET',
            dataType: 'json',
            success: function (data) {
                if (success) {
                    var container = $("#det_content");
                    container.empty();
                    var content = "";
                    if (data[0] != null) {
                        content += "<div class='next'>";
                        content += "<div class='next_title'>" + data[0]['title'] + "</div>";
                        content += "<div class='next_description'>" + data[0]['description'] + "</div>";
                        content += "<div class='next_dates'>" + data[0]['begin'] + " - " + data[0]['end'] + "</div>";
                        content += "<div class='next_state'>" + data[0]['state'] + "</div>";
                        content += "</div>";
                    } else {
                        content += "<div class='empty'>Pas d'événement de prévu</div>";
                    }
                    $("#det_content").html(content);
                }
            },
            error: function () {
                if (error) {
                    error();
                }
            }
        });
        $.mobile.loading('hide')
    }

    wsRequester.getMyEvents = function (success, error) {
        $.mobile.loading('show');
        url = myApplication.url + "event/getNextFuturEventByRegistration?idUser=" + myApplication.connectedUser;
        $.ajax({
            url: url,
            type: 'GET',
            dataType: 'json',
            success: function (data) {
                var container = $("#sou_content");
                container.empty();
                var content = "";
                if (data.length > 0) {
                    for (var i = 0, len = data.length; i < len; ++i) {
                        content += "<div class='myevent'>";
                        content += "<div class='myevent_title'>" + data[i].title + "</div>";
                        content += "<div class='myevent_description'>" + data[i].description + "</div>";
                        content += "<div class='buttons_group'>";
                        content += "<button class='myevent_detail' event='" + data[i].Id + "'>Détails</button>";
                        content += "<button class='myevent_unsubs' event='" + data[i].Id + "'>Ne plus participer</button>";
                        content += "</div>";
                        content += "</div>";
                    }
                } else {
                    content += "<div class='empty'>Vous êtes inscrit à aucun événement</div>";
                }
                $("#sou_content").html(content);
            },
            error: function () {
                if (error) {
                    error();
                }
            }
        });
        $.mobile.loading('hide');
    }

    wsRequester.getAvailableEvents = function (success, error) {
        url = myApplication.url + "Event/GetEventForUnregisteredUser?iduser=" + myApplication.connectedUser;
        $.ajax({
            url: url,
            type: 'GET',
            dataType: 'json',
            success: function (data) {
                if (success) {
                    var container = $("#aut_content");
                    container.empty();
                    var content = "";
                    if (data.length > 0) {
                        for (var i = 0, len = data.length; i < len; ++i) {
                            content += "<div class='available'>";
                            content += "<div class='available_title'>" + data[i].title + "</div>";
                            content += "<div class='available_description'>" + data[i].description + "</div>";
                            content += "<div class='buttons_group'>";
                            content += "<button class='available_detail' event='" + data[i].Id + "'>Détails</button>";
                            content += "<button class='available_parti' event='" + data[i].Id + "'>Participer</button>";
                            content += "</div>";
                            content += "</div>";
                        }
                    } else {
                        content += "<div class='empty'>Pas de nouvel événement de prévu</div>";
                    }
                    $("#aut_content").html(content);
                }
            },
            error: function () {
                if (error) {
                    error();
                }
            }
        });
        $.mobile.loading('hide')
    }

    wsRequester.takePartToAnEvent = function (success, error, eventid) {
        url = myApplication.url + "Registration/addRegistration?iduser=" + myApplication.connectedUser + "&idevent=" + eventid;
        $.ajax({
            url: url,
            type: 'GET',
            dataType: 'json',
            success: function (data) {
                if (success) {
                    navigator.notification.confirm("Vous avez été enregistré à l'événement", null);
                }
            },
            error: function () {
                if (error) {
                    error();
                }
            }
        });
        $.mobile.loading('hide')
    }

})(jQuery);