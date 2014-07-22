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
var map;
	
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

    $(document).on("click", ".available_detail,.myevent_detail", function (event) {
        myApplication.showDetail($(this).attr("event"));
        wsRequester.getEventWithDetails(myApplication.successHandler,
                                       myApplication.errorHandler,
                                       $(this).attr("event"));
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

    $(document).on("click", ".myevent_unsubs", function (event) {
        wsRequester.stopTakingPartToAnEvent(myApplication.successHandler,
                                       myApplication.errorHandler,
                                       $(this).attr("event"));
    });

    function onBackButton() {
        myApplication.showPage(myApplication.actions.pop(), true);
        if (myApplication.actions.length === 0) {
            document.removeEventListener("backbutton");
        }
    }

    function onDeviceReady() {
        myApplication.showPage("el_connexion", true);
        var pushNotification = window.plugins.pushNotification;
        pushNotification.register(myApplication.successHandler,
                                  myApplication.errorHandler,
                                  { "senderID": "334799251298", "ecb": "myApplication.onNotificationGCM" });
    }

    /* Gestion de la prise de photo */

    $(document).on("click", ".take_shot", function (event) {
        navigator.camera.getPicture(cameraSuccess, cameraError, { quality: 50 });
    });

    function cameraSuccess(imageData) {
        //var image = document.getElementById('myImage');
        //image.src = "data:image/jpeg;base64," + imageData;
    }

    function cameraError(message) {
        alert('Failed because: ' + message);
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

    function initialize() {
        var mapOptions = {
            center: new google.maps.LatLng(-34.397, 150.644),
            zoom: 8
        };
        map = new google.maps.Map(document.getElementById("map-canvas"), mapOptions);
    }
    google.maps.event.addDomListener(window, 'load', initialize);

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
        url = myApplication.url + "event/GetEventByUserRegistration?idUser=" + myApplication.connectedUser;
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
                    myApplication.feedContent("el_autres", false);
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

    wsRequester.stopTakingPartToAnEvent = function (success, error, eventid) {
        url = myApplication.url + "Registration/DeleteRegistration?idUser=" + myApplication.connectedUser + "&idEvent=" + eventid;
        $.ajax({
            url: url,
            type: 'GET',
            dataType: 'json',
            success: function (data) {
                if (success) {
                    myApplication.feedContent("el_souscrits", false);
                    navigator.notification.alert(
                        "Vous n'êtes plus lié à cet événement",
                        null,
                        'Succès', 
                        'Ok,Cancel'
                    );
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

    wsRequester.getEventWithDetails = function (success, error, eventid) {
        url = myApplication.url + "Event/GetEventById?idevent=" + eventid;
        $.ajax({
            url: url,
            type: 'GET',
            dataType: 'json',
            success: function (data) {
                if (success) {
                    var container = $("#detail_content");
                    container.empty();
                    var content = "";
                    content += "<table>";
                    content += "<tr><td class='f_column'>Titre:</td><td>" + data[0].title + "</td></tr>";
                    content += "<tr><td class='f_column'>Description:</td><td>" + data[0].description + "</td></tr>";
                    content += "<tr><td class='f_column'>Latitude:</td><td>" + data[0].latitude + "</td></tr>";
                    content += "<tr><td class='f_column'>Longitude:</td><td>" + data[0].longitude + "</td></tr>>";
                    content += "<tr><td class='f_column'>Date de début:</td><td>" + data[0].begin + "</td></tr>";
                    content += "<tr><td class='f_column'>Date de fin:</td><td>" + data[0].end + "</td></tr>";
                    content += "<tr><td class='f_column'>Etat:</td><td>" + data[0].state + "</td></tr>";
                    content += "</table>";
                    content += "<h1>Liste des participants</h1>";
                    content += "<button class='take_shot' event='" + data[0].Id + "'>Ajouter une photo</button>";
                    $("#logging").append(wsRequester.getUsersOfAnEvent(myApplication.successHandler,
                                           myApplication.errorHandler,
                                           data[0].Id));
                    content += "<button class='detail_event_cl'>Retour</button>";
                    $("#detail_content").html(content);
                    map.setCenter(new google.maps.LatLng(data[0].latitude, data[0].longitude), 5);
                    new google.maps.Marker({
                        position: new google.maps.LatLng(data[0].latitude, data[0].longitude),
                        map: map
                    });
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

    wsRequester.getUsersOfAnEvent = function (success, error, eventid) {
        url = myApplication.url + "User/GetUserByEvent?idEvent=" + eventid;
        $.ajax({
            url: url,
            type: 'GET',
            dataType: 'json',
            success: function (data) {
                if (success) {
                    var content = "";



                    return "oui";
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