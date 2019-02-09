(function(µ,SMOD,GMOD,HMOD,SC){

	let request=GMOD("request");
	let actionize=GMOD("gui.actionize")

	SC=SC({
		TableConfig:"gui.TableConfig.Select",
		Table:"gui.Table",
		addStorageDialog:"addStorageDialog",
		updateDialog:"updateDialog",
		Storage:"Storage",
		StorageBrowser:"StorageBrowser",
		blocked:"gui.blocked",
		loading:"gui.loading"
	});
	let sort=new Intl.Collator(navigator.languages,{sensitivity:"base"}).compare

	let content=document.getElementById("content");
	let actions=document.getElementById("actions");

	let loadingElement=SC.loading.layered();
	document.body.appendChild(loadingElement);
	request.json("rest/storage/warnings").then(warnings=>
	{
		if(Object.keys(warnings).length>0) alert("Warning!\n"+JSON.stringify(warnings,null,"\t"));
		return updateStorages();
	})
	.then(()=>
	{
		loadingElement.remove();
		SC.blocked.unblock(document.body);
	});

	let tableConfig=null;
	let storageTable=null;
	let updateStorages=function()
	{
		if(storageTable==null)
		{
			storageTable=new SC.Table(new SC.TableConfig(["name","path"],{radioName:"storageSelect",noInput:true}));
			content.appendChild(storageTable.getTable());
		}
		return request.json("rest/storage/list")
		.then(function(data)
		{
			storageTable.clear();
			data=data.map(SC.Storage.fromJSON)
			.sort((a,b)=>sort(a.name,b.name));
			storageTable.add(data);
		});
	};

	actionize({
		newStorage:function()
		{
			SC.addStorageDialog();
		},
        updateStorage:function()
        {
			let selected=storageTable.getSelected()[0];
			SC.updateDialog(selected.name);
        },
        deleteStorage:function()
        {

        },
        browse:function()
        {
        	new SC.StorageBrowser(storageTable.data);
        }
	},actions)

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);
