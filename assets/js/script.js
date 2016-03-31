document.addEventListener( "DOMContentLoaded", function () {
    const API_ROOT = "http://en.wikipedia.org/w/api.php",
          API_SUFFIX = "&format=json&callback=?&continue=";

    // Polyfill
    // -------------------------------------------

    // From https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/includes#Polyfill
    if (!String.prototype.includes) {
        String.prototype.includes = function(search, start) {
            'use strict';
            if (typeof start !== 'number') {
                start = 0;
            }
            if (start + search.length > this.length) {
                return false;
            } else {
                return this.indexOf(search, start) !== -1;
            }
        };
    }

    document.getElementById( "status" ).innerHTML = "Loading...";

    loadJsonp( API_ROOT + "?action=query&prop=revisions&rvprop=content&titles=Template_talk:Did_you_know" + API_SUFFIX, function ( data ) {
        if ( data.query && data.query.pages ) {
            var pageid = Object.getOwnPropertyNames( data.query.pages )[0],
                text = data.query.pages[pageid].revisions[0]["*"],
                subnames = parseTtdyk( text );

            document.body.removeChild( document.getElementById( "status" ) );

            // Build table
            for ( day in subnames ) {
                subnames[day].forEach( function ( title ) {
                    var newRow = document.createElement( "tr" );
                    var newDateCell = document.createElement( "td" );
                    newDateCell.appendChild( document.createTextNode( day ) );
                    newRow.appendChild( newDateCell );
                    var newTitleCell = document.createElement( "td" );
                    newTitleCell.appendChild( document.createTextNode( title ) );
                    newRow.appendChild( newTitleCell );
                    var newStatusCell = document.createElement( "td" );
                    newStatusCell.setAttribute( "data-value", "1" );
                    loadNomStatus( newStatusCell, title );
                    newRow.appendChild( newStatusCell );
                    document.getElementById( "subpages" ).children[0].appendChild( newRow );
                } );
            }

            // Initialize table
            setTimeout( function () {
                var table = document.querySelector( "#subpages" )
                Sortable.initTable( table );
                table.addEventListener('Sortable.sorted', function() {
                    console.log('table was sorted!');
                } );
            }, 5000 );
        }
    } );

    function parseTtdyk ( text ) {
        var dates = {},
            index = 0;
        text = text
            .replace( "==Older nominations==", "" )
            .replace( "==Current nominations==", "" );
        index = text.indexOf( "===" );
        while ( index !== -1 ) {

            // Get the header
            var headerStart = text.indexOf( "===", index ) + 3,
                headerEnd = text.indexOf( "===", headerStart ),
                header = text.substring( headerStart, headerEnd ),
                date = header.replace( "Articles created/expanded on ", "" ).replace( /\([\s\S]+?\)/, "" ).trim();

            // Get the section text
            var nextHeaderStart = text.indexOf( "===", headerEnd + 3 );
            if ( nextHeaderStart === -1 ) {
                sectionText = text.substring( headerEnd );
            } else {
                sectionText = text.substring( headerEnd, nextHeaderStart );
            }
            sectionText = sectionText
                .replace( "===", "" )
                .replace( /<!--[\s\S]+?-->/, "" )
                .trim();

            // Parse out the nomination subpage names
            var subpageNames = sectionText
                .split( "\n" )
                .filter( function ( line ) {
                    return line.includes( "Did you know nominations" );
                } )
                .map( function ( line ) {
                    return line
                        .replace( /\{\{(Template:)?Did you know nominations\//, "" )
                        .replace( "\}\}", "" );
                } );

            // Store the nom sub names
            dates[date] = subpageNames;

            index = nextHeaderStart;
        }
        return dates;
    }

    function loadNomStatus( tableCell, nomTitle ) {
        loadJsonp( API_ROOT + "?action=query&prop=categories&titles=Template:Did_you_know_nominations/" + nomTitle + API_SUFFIX, function ( data ) {
            if ( data.query && data.query.pages ) {
                var pageid = Object.getOwnPropertyNames( data.query.pages )[0],
                    categories = data.query.pages[pageid].categories;
                if ( !categories ) {
                    return;
                }
                categories.forEach( function ( category ) {
                    var name = category.title;
                    if ( name.includes( "Passed" ) ) {
                        tableCell.appendChild( document.createTextNode( "P" ) );
                        tableCell.setAttribute( "data-value", "2" );
                    } else if ( name.includes( "Failed" ) ) {
                        tableCell.appendChild( document.createTextNode( "F" ) );
                        tableCell.setAttribute( "data-value", "0" );
                    }
                } );
            }
        } );
    }

    // Utility functions
    // -------------------------------------------

    // Adapted from https://gist.github.com/gf3/132080/110d1b68d7328d7bfe7e36617f7df85679a08968
    var jsonpUnique = 0;
    function loadJsonp(url, callback, context) {
        var name = "_jsonp_" + jsonpUnique++;
        if (url.match(/\?/)) url += "&callback="+name;
        else url += "?callback="+name;
        var script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = url;
        window[name] = function(data){
            callback.call((context || window), data);
            document.getElementsByTagName('head')[0].removeChild(script);
            script = null;
            delete window[name];
        };
        document.getElementsByTagName('head')[0].appendChild(script);
    }

    // From http://stackoverflow.com/a/6323598/1757964
    function allMatches ( regex, string ) {
        var matches = [],
            match;
        do {
            match = regex.exec( string );
            if ( match ) {
                matches.push( match );
            }
        } while ( match );
        return matches;
    }
} );
