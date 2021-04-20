
const sql = require("../helpers/sqlConfig");
const jwt = require("../helpers/jwtVerify");


module.exports = async function (context, req) {
    
    console.log("Hello");

    if( req.params.operation == "create" ) {
        context.res = await createTag(req);
    } else if( req.params.operation == "get" ) {
        context.res = await getTags(req);
    } else if ( req.params.operation == "delete" ) {
        context.res = await deleteTag(req);
    } else {
        context.res = {status: 404};
    }

}

async function createTag ( req ) {

    // ?Tag=x
    let auth = verifyJwtIdentity( req );

    if( auth.status !== 200 ) {
        return {status: auth.status};
    }

    let OrganisationEmail = auth.payload;

    console.log(auth);

    let tagToInsert = null;

    if( "Tag" in req.query ) {
        tagToInsert = req.query.Tag;
    } else {
        return {status: 400};
    }

    let inputs = [
        {name: "OrganisationEmail", type: sql.NVarChar, value: OrganisationEmail},
        {name: "TagName", type: sql.NVarChar, value: tagToInsert}
    ];

    let sqlQueryString = "SELECT OrganisationID FROM proj09.Organisation WHERE Email=@OrganisationEmail"
    let sqlResult = await sql.query(sqlQueryString, inputs);

    if (sqlResult.status !== 200) {
        return {status: sqlResult.status};
    }

    console.log(sqlResult);

    if( sqlResult.data.length !== 1 ) {
        return {status: 500};
    }

    inputs.push( {name: "OrganisationID", type: sql.Int, value: sqlResult.data[0].OrganisationID} )

    sqlQueryString = "INSERT INTO proj09.Tags (TagName, OrganisationID) values (@TagName, @OrganisationID)";
    sqlResult = await sql.query(sqlQueryString, inputs);

    if(sqlResult.status !== 200) {
        return {status: sqlResult.status};
    }

    return { status: 200 }
    
}

async function getTags( req ) {

    if( !("OrganisationID" in req.query)  ) {
        return {status: 400};
    }

    let inputs = [{name: "OrganisationID", type: sql.Int, value: req.query.OrganisationID}]; 
    sqlQueryString = "SELECT * FROM proj09.Tags WHERE OrganisationID=@OrganisationID";

    let sqlResult = await sql.query(sqlQueryString, inputs);

    console.log(sqlResult);

    if(sqlResult.status !== 200) {
        return {status: sqlResult.status};
    }

    return {

        status: 200,
        headers: { "Content-Type": "application/json" },
        body: {
            tags: sqlResult.data
        }

    }

}

async function deleteTag( req ) {

    // ?Tag=x

    let auth = verifyJwtIdentity( req );

    if( auth.status !== 200 ) {
        return {status: auth.status};
    }

    let OrganisationEmail = auth.payload.payload;

    let tagToDelete = null;

    if( "Tag" in req.query ) {
        tagToDelete = req.query.Tag;
    } else {
        return {status: 400};
    }

    let inputs = [
        {name: "OrganisationEmail", type: sql.NVarChar, value: OrganisationEmail},
        {name: "TagName", type: sql.NVarChar, value: tagToDelete}
    ];

    sqlQueryString = "DELETE FROM proj09.Tags WHERE TagName=@TagName AND OrganisationEmail=(SELECT OrganisationID FROM proj09.Organisation WHERE Email=@OrganisationEmail)";

    let sqlResult = await sql.query(sqlQueryString, inputs);

    if(sqlResult.status !== 200) {
        return {status: sqlResult.status};
    }

    return { status: 200 }

}

function verifyJwtIdentity( req ) {

    // GET JWT IDENTITY

    let organisationToken = null;

    if ( "organisationToken" in req.body ) {
        organisationToken = req.body.organisationToken;
    } else {
        return {status: 400};
    }

    let auth = jwt.verifyAccessToken(organisationToken);

    return auth;

}