var STORAGE_ROTATION=10;

var JsonConnector=µ.getModule("DB/jsonConnector");

var Path=require("path");

module.exports=new JsonConnector(Path.resolve(__dirname,"../storages/storages.json"),{
	fileRotation:STORAGE_ROTATION,
	prettyPrint:true
});