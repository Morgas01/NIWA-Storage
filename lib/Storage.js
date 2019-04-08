(function(µ,SMOD,GMOD,HMOD,SC){

	SC=SC({
		Structure:"Structure"
	});

	let Storage=µ.Class({
		constructor:function({name,path,structure})
		{
			this.name=name;
			this.path=path;
			this.structure=structure||null;
		}
	});
	Storage.fromJSON=function(json)
	{
		if(json.structure)json.structure=SC.Structure.fromJSON(json.structure);
		return new Storage(json);
	};
	SMOD("Storage",Storage);
	
	if(typeof module!="undefined") module.exports=Storage;
	
})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);