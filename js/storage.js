(function(µ,SMOD,GMOD,HMOD,SC){
	
	var DBOBJECT=GMOD("DBObj");
	
	SC=SC({
		DBField:"DBField",
		FStruct:require.bind(null,"../js/FileStructure"),
	});
	
	var Storage=µ.Class(DBOBJECT,{
		objectType:"storage",
		init:function(param)
		{
			param=param||{};
			this.mega(param);
			this.addField("name",SC.DBField.TYPES.STRING,param.name);
			this.addField("path",SC.DBField.TYPES.STRING,param.path);
			this.addField("structure",SC.DBField.TYPES.JSON,param.structure);
			this.addField("backups",SC.DBField.TYPES.JSON,param.backups||{});
		},
		fromJSON:function(jsonObject)
		{
			this.mega(jsonObject);
			this.structure=structureFromJSON(this.structure);
			return this;
		}
	});
	var structureFromJSON=function(s)
	{
		var rtn=new SC.FStruct(s.name,s);
		for(var c of s.children) rtn.addChild(structureFromJSON(c));
		return rtn;
	}
	
	if(typeof module!="undefined") module.exports=Storage;
	else (typeof NIWA_Storage=="undefined"?(NIWA_Storage={}):NIWA_Storage).Storage=Storage;
	
})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);