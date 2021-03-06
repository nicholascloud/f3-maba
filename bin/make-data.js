const axios = require( "axios" );
const fs = require( "fs" );
const path = require( "path" );
const uniq = require( "lodash/uniq" );
const addedRegions = require( "./added-regions.json" );
const renamedRegions = require( "./renamed-regions.json" );

const PROJECT_ROOT = path.resolve( __dirname, ".." );
const DATA_ROOT = path.join( PROJECT_ROOT, "server", "data" );

const f3MapURL = process.env.F3_MAP_URL;
if ( !f3MapURL ) {
	console.error( "No map URL supplied." );
	process.exit( 1 );
}

async function getMapData() {
	const response = await axios.get( f3MapURL );
	return response.data;
}

const renameRegions = ( region ) => {
	return renamedRegions[ region ] || region;
};

const trim = str => str.trim();

( async function () {
	/*
	[
	  "Group",
	  "Time",
	  "Type",
	  "Region",
	  "Website",
	  "Notes",
	  "Marker Icon",
	  "Marker Color",
	  "Icon Color",
	  "Custom Size",
	  "Name",
	  "Image",
	  "Description",
	  "Location",
	  "Latitude",
	  "Longitude"
	],
	*/

	console.info( "fetching data..." );
	const pointsJSON = await getMapData();

	const values = pointsJSON.values.slice( 1 );

	const allAOs = values.reduce( ( aos, point ) => {
		const region = point[ 3 ];
		const name = point[ 10 ];
		const regionNames = aos[ region ] || [];
		regionNames.push( name );
		aos[ region ] = uniq( regionNames ).sort();
		return aos;
	}, {} );

	allAOs.NONE = [ "NONE" ];

	console.info( "writing AOs..." );
	fs.writeFile( path.join( DATA_ROOT, "aos.json" ), JSON.stringify( allAOs, null, 2 ), ( err ) => {
		if ( err ) {
			console.error( err );
			return process.exit( 1 );
		}
		const regions = Object.keys( allAOs );
		const adjustedRegions = uniq( regions.concat( addedRegions ).map( renameRegions ) ).map( trim ).sort();
		console.info( "writing regions..." );
		fs.writeFile( path.join( DATA_ROOT, "regions.json" ), JSON.stringify( adjustedRegions ), ( err ) => {
			if ( err ) {
				console.error( err );
				return process.exit( 1 );
			}
			process.exit( 0 );
		} );
	} );
} )();
