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
		loading:"gui.loading",
		jobList:"jobList"
	});
	let sort=new Intl.Collator(navigator.languages,{sensitivity:"base"}).compare

	let listWrapper=document.getElementById("list");
	let browserWrapper=document.getElementById("browser");
	let jobsWrapper=document.getElementById("jobs");
	let actions=document.getElementById("list-actions");

	let loadingElement=SC.loading.layered();
	document.body.appendChild(loadingElement);


	let storageTable;
	let browser;
	let jobList;


	request.json("rest/storage/warnings").then(warnings=>
	{
		if(Object.keys(warnings).length>0) alert("Warning!\n"+JSON.stringify(warnings,null,"\t"));

		storageTable=new SC.Table(new SC.TableConfig(["name","path"],{radioName:"storageSelect",noInput:true}));
		listWrapper.appendChild(storageTable.getTable());

		browser=new SC.StorageBrowser([]);
		browserWrapper.appendChild(browser.content);

		jobList=SC.jobList;
		jobList.connect();
		jobsWrapper.appendChild(jobList.element);

		return updateStorages();
	})
	.then(()=>
	{
		loadingElement.remove();
		SC.blocked.unblock(document.body);
	});

	let updateStorages=function()
	{
		return request.json("rest/storage/list")
		.then(function(data)
		{
			storageTable.clear();
			data=data.map(SC.Storage.fromJSON)
			.sort((a,b)=>sort(a.name,b.name));
			storageTable.clear().add(data);
			browser.setData(data);
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
