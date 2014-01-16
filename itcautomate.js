var system = require( 'system' );
var page = require( 'webpage' ).create();
var state = "login"; // use this to keep track of the state-machine-like state that we are expecting to be in
var step = 0;

var appName, appSKU, bundleID, version;

// load args:
for ( var i = 1; i < system.args.length; i++ ) { // start at 1 to skip binary name
	// console.log( "arg " + i + ": " + system.args[i] );
	if ( system.args[i][0] == "-" ) { // this is a switch
		var value = null;
		if ( i + 1 < system.args.length )
			value = system.args[i + 1];

		switch ( system.args[i][1] ) {
			case "a":
				appName = value;
			break;

			case "b":
				bundleID = value;
			break;

			case "s": // sku
				appSKU = value;
			break;

			case "v": // version
				version = value;
			break;
		}
	} else
		continue; // skip it
}

console.log( "App Name:  " + appName );
console.log( "Bundle ID: " + bundleID );
console.log( "App SKU:   " + appSKU );
console.log( "Version:   " + version );
console.log( "" );

function processState() {
	console.log( "\nSTATE: " + state );
	var title = page.evaluate(function() {
		return document.title;
	});
	console.log( title + " (" + page.url + ")" );

	var imageName = "state" + step + "." + state + ".png";

	switch ( state ) {
		case "login":
			page.evaluate( function() {
				var username_field = $j('#accountname')[0];//document.getElementById('accountname');
				if ( username_field ) {
					username_field.value = "<your userid>";
					var password_field = document.getElementById('accountpassword');
					password_field.value = "<your password>";
					document.forms[0].submit();
				}
			} );
			state = "home";
		break;

		case "home":
			state = page.evaluate( function() {
				var link = $j("a:contains('Manage Your Apps')")[0];
				window.location = link.href;
				return "manageApps";
			} );
		break;

		case "manageApps":
			state = page.evaluate( function( appSKU ) {
				console.log( "appSKU: " + appSKU );
				$j('select')[1].value = 1;
				$j('input')[3].value = appSKU;
				document.forms[1].submit();
				return "searchResults";
			}, appSKU );
		break;

		case "searchResults":
			state = page.evaluate( function() {
				var state;
				if ( $j('#LCPurpleSoftwarePageWrapperErrorMessage').length ) { // error message visible, assume no hits
					state = "createApp";
					window.location = $j('.wrapper-topleft-button')[0].parentElement.href;
				} else {
					state = "appDetails";
					window.location = $j('a')[3].href;
				}
				return state;
			} );
		break;

		case "createApp":
			state = page.evaluate( function( appName, appSKU, bundleID ) {
				$j('input')[0].value = appName;
				$j('input')[1].value = appSKU;
				$j('#primary-popup[0]>option').each( function(i) {
					if ( this.innerHTML.indexOf( "<your wildcard bundle identifier>" ) != -1 ) {
						$j('#primary-popup')[0].value = this.value;
						return false; // break .each()
					}
				} );
				var bundleIDParts = bundleID.split('.');
				$j('#wildcardSuffix')[0].value = bundleIDParts[bundleIDParts.length-1];
				$j('.continueActionButton')[0].click();
				return "newAppPricing";
			}, appName, appSKU, bundleID );
		break;

		case "appDetails":
			state = page.evaluate( function() {
				var state;
				button = $j('.blue-btn')[5];
				if ( button.innerHTML == "Add Version" ) {
					state = "addVersion"
					window.location = button.href;
				} else if ( button.innerHTML == "View Details" ) {
					state = "updateVersion";
					// there is already a pending new version. we cannot create a new one but we might be able to edit the pending one.
					window.location = $j('.blue-btn:contains("View Details")')[1].href;
				}
				return state;
			} );
		break;

		case "newAppPricing":
			state = page.evaluate( function() {
				$j('#pricingPopup')[0].value = 0;
				$j('.continueActionButton')[0].click();
				return "newAppDetails";
			} );
		break;

		case "newAppDetails":

		break;

		case "addVersion":
			console.log( "No pending version; adding new one" );
			state = page.evaluate( function( version ) {
				$j('input')[0].value = version;
				$j('textarea')[0].value = "Improvements and bug fixes."; // will be filled-in by upload script later
				$j('.saveChangesActionButton')[0].click();
				return "end"; // temp
			}, version );
		break;

		case "updateVersion":
			console.log( "Found existing pending version; attempting to update version (TODO)" );
			state = page.evaluate( function( version ) {
				$j('.small-grey-btn:contains("Edit")')[0].parentElement.onclick();
				if ( $j('input')[4].value != version ) {
					$j('input')[4].value = version;
					return "end";
				} else
					return "abort"; // already has the correct version
			}, version );
		break;

		default:
		case "end":
			state = "abort";
		break;
	}

	page.render( imageName );

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
