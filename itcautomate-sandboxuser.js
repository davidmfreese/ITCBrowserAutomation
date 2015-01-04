var system = require( 'system' );
var page = require( 'webpage' ).create();
var state = "login"; // use this to keep track of the state-machine-like state that we are expecting to be in
var states = {
	"start": "",
	"login": "",
	"home": "",
	"user_roles": "",
	"sandbox_users": "/WebObjects/iTunesConnect.woa/ra/ng/users_roles/sandbox_users",
	"sandbox_users_new": "/WebObjects/iTunesConnect.woa/ra/ng/users_roles/sandbox_users/new",
	"create_sandbox_user": "/WebObjects/iTunesConnect.woa/ra/ng/users_roles/sandbox_users/new",
	"end": ""
}
var step = 0;
var baseUrl = "https://itunesconnect.apple.com"



var firstName = "mshk", 
	lastName = "mshk",
	birthMonth = "3",
	birthDay = "8",
	appStoreTerritory = "United States",
	secretQuestion = "WhoIsYourBestFriend",
	secretAnswer = "MyselfOfCourse";



var sandboxUserEmail, sandboxUserPassword, itunesEmail, itunesPassword;

// load args:
for ( var i = 1; i < system.args.length; i++ ) { // start at 1 to skip binary name
	// console.log( "arg " + i + ": " + system.args[i] );
	if ( system.args[i][0] == "-" ) { // this is a switch
		var args = system.args[i].substring(1).split(" ");
		var key = args[0];
		var value =  null;// args[1];


		if ( i + 1 < system.args.length ) {
			value = system.args[i + 1];
		}

		//console.log("key: " + key);
		//console.log("value: " + value)

		switch ( key ) {
			case "f":
				firstName = value;
			break;

			case "l":
				lastName = value;
			break;

			case "e": // sku
				sandboxUserEmail = value;
			break;

			case "p": // skuf
				sandboxUserPassword = value;
			break;

			case "iuser": // version
				itunesEmail = value;
			break;
			case "ipass": // version
				itunesPassword = value;
			break;
		}
	} else
		continue; // skip it
}

console.log( "Sandbox User Email:  " + sandboxUserEmail );
console.log( "Sandbox User Password: " + sandboxUserPassword );

//console.log("itunesEmail: " + itunesEmail);
//console.log("itunesPassword: " + itunesPassword);

/*
debugger;

for (var i=0; i < 5; i++)
{
  console.log('debugging in phantom js:' + i);
}
*/
function waitFor(testFx, onReady, timeOutMillis) {
    var maxtimeOutMillis = timeOutMillis ? timeOutMillis : 3000, //< Default Max Timout is 3s
        start = new Date().getTime(),
        condition = false,
        interval = setInterval(function() {
            if ( (new Date().getTime() - start < maxtimeOutMillis) && !condition ) {
                // If not time-out yet and condition not yet fulfilled
                condition = (typeof(testFx) === "string" ? eval(testFx) : testFx()); //< defensive code
            } else {
                if(!condition) {
                    // If condition still not fulfilled (timeout but condition is 'false')
                    console.log("'waitFor()' timeout");
                    phantom.exit(1);
                } else {
                    // Condition fulfilled (timeout and/or condition is 'true')
                    console.log("'waitFor()' finished in " + (new Date().getTime() - start) + "ms.");
                    typeof(onReady) === "string" ? eval(onReady) : onReady(); //< Do what it's supposed to do once the condition is fulfilled
                    clearInterval(interval); //< Stop this interval
                }
            }
        }, 250); //< repeat check every 250ms
};


//Home page holder
var home = ""

function processState() {
	console.log( "\nSTATE: " + state );
	var title = page.evaluate(function() {
		return document.title;
	});
	console.log( title + " (" + page.url + ")" );
	var imageName = "state" + step + "." + state + ".png";
	var ready = false;


	switch ( state ) {
		case "login":
			page.evaluate( function(itunesEmail, itunesPassword) {
				var username_field = $('#accountname').eq(0);//document.getElementById('accountname');
				if ( username_field ) {
					username_field.val(itunesEmail);
					var password_field = document.getElementById('accountpassword');
					password_field.value = itunesPassword;
					document.forms[0].submit();
				}
			}, itunesEmail, itunesPassword);
			state = "home";
			page.render( imageName );
		break;

		case "home":
			waitFor(function() {
				return page.evaluate( function() {
					var link = $("a:contains('Users and Roles')").eq(1);
					return link.is(':visible');
				});
			}, function() {
				window.setTimeout(function() {
					page.render( imageName );
				}, 50);
				state = page.evaluate( function(baseUrl) {
					home = window.location;
					console.log("home - " + home);
		      
		            var link = $("a:contains('Users and Roles')").eq(1);
					console.log("home - Users and Roles: " + baseUrl + link.attr("href"));
					//link.trigger("click");

					//link.trigger("click");
					window.location = baseUrl + link.attr("href");
					
					state = "user_roles";
					return "user_roles";

				}, baseUrl);

			});
		break;

		case "user_roles":
			waitFor(function() {
				return page.evaluate( function() {
					var link = $("a:contains('Sandbox Testers')").first();
					return link.is(":visible");
				});
			}, function() {
				window.setTimeout(function() {
					page.render( imageName );
				}, 500);
				state = page.evaluate( function(baseUrl) {
		            var link = $("a:contains('Sandbox Testers')").eq(0);
		            link.trigger("click");
					console.log("user_roles - Sandbox Testers: " + baseUrl + link.attr("href"));

					window.location = baseUrl + link.attr("href");
					//link.trigger("click");
					state = "sandbox_users"
					return "sandbox_users";

				}, baseUrl);
			});
		break;

		case "sandbox_users":
			waitFor(function() {
				return page.evaluate( function() {
					var rowCount = $('.table-itc-users  tr').length;
					return rowCount> 0;
				}, 5000);
			}, function() {
				window.setTimeout(function() {
					page.render( imageName );
				}, 500);
				state = page.evaluate( function(baseUrl, sandboxUserEmail) {
					var emailExists = false;
					$(document).find("tr").each(function () { //iterate through rows
				        var existingSandboxEmail = $(this).find("td:eq(0)").text(); //get value of first td in row
				        if (existingSandboxEmail == sandboxUserEmail) { 
				            emailExists = true; //raise flag if yes
				            console.log("Email Address Exists");
				        }
					 });

				    if(!emailExists) {
						var link = $("a:contains('Add')").first();
						window.location = baseUrl + link.attr("href");
						state = "sandbox_users_new"
						return "sandbox_users_new";
					} else {
						state = "end"
						return "end";
					}
				}, baseUrl, sandboxUserEmail);
			});
			
		break;

		case "sandbox_users_new":
			waitFor(function() {
				return page.evaluate( function() {
					var link = $("label:contains('App Store Territory')").parent().find("select").first();
					return link.is(":visible");
				});
			}, function() {
				
				state = page.evaluate( function(firstName, lastName, sandboxUserEmail, sandboxUserPassword, secretQuestion, secretAnswer, birthMonth, birthDay, appStoreTerritory ) {
					$("label:contains('First Name')").parent().find("input").first().val(firstName).trigger('input');
					$("label:contains('Last Name')").parent().find("input").first().val(lastName).trigger('input');
					$("label:contains('Email')").parent().find("input").first().val(sandboxUserEmail).trigger('input');
					$("label:contains('Password')").parent().find("input").first().val(sandboxUserPassword).trigger('input');
					$("label:contains('Confirm Password')").parent().find("input").first().val(sandboxUserPassword).trigger('input');
					$("label:contains('Secret Question')").parent().find("input").first().val(secretQuestion).trigger('input');
					$("label:contains('Secret Answer')").parent().find("input").first().val(secretAnswer).trigger('input');

					$("label:contains('Date of Birth')").parent().find("select").eq(0).val(birthMonth - 1);
	    			$("label:contains('Date of Birth')").parent().find("select").eq(1).val(birthDay - 1);
	    
	    			var appStoreTerritoryValue = $("option:contains('" + appStoreTerritory + "')").first().val();
					$("label:contains('App Store Territory')").parent().find("select").first().val(appStoreTerritoryValue);


					$("select").each(function() {
						var _this = $(this);

						_this.triggerHandler("input");
						_this.trigger("input");
						_this.triggerHandler("change");
						_this.trigger("change");
					});

					angular.element(document.forms[0]).scope().$apply();

					var saveButton = $(".btn-actions").first().find("button").eq(1);
					saveButton.on("click", function() {
						console.log("save button clicked");
					});

					saveButton.trigger("click");

					return "end";

				}, firstName, lastName, sandboxUserEmail, sandboxUserPassword, secretQuestion, secretAnswer, birthMonth, birthDay, appStoreTerritory );
				window.setTimeout(function() {
					page.render( imageName );
					phantom.exit(0);
				}, 2000);
				
			});
		break;

		case "create_sandbox_user":
			state = page.evaluate( function(baseUrl, newSandBoxUserURl) {
				window.location = baseUrl + newSandBoxUserURl;
				return "sandbox_users_new";

			},  baseUrl, states["create_sandbox_user"]);
		break;

		default:
		case "end":
			state = "abort";
		break;
	}

	if ( state == "abort" )
		phantom.exit();
}

page.onConsoleMessage = function( message ) {
	console.log( "The page says: " + message );
};

page.onLoadFinished = function() {
	step++;
	processState();	
    
};

page.open( "https://itunesconnect.apple.com/WebObjects/iTunesConnect.woa" );
