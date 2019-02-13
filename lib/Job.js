(function(µ,SMOD,GMOD,HMOD,SC){

	let Task=GMOD("Task");
	let FIELD=GMOD("DBField");

	SC=SC({});
	
	let Job=µ.Class(Task,{
		constructor:function(param={})
		{
			this.mega(param)

			this.addField("action",			FIELD.TYPES.STRING	,param.action);
			this.addField("structures",		FIELD.TYPES.JSON	,param.structures);
			this.addField("target",			FIELD.TYPES.JSON	,param.target);
			this.addField("targetStorage",	FIELD.TYPES.STRING	,param.targetStorage);
		}
	});
	SMOD("Job",Job);
	
	if(typeof module!="undefined") module.exports=Job;
	
})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);