(function(µ,SMOD,GMOD,HMOD,SC){

	let request=GMOD("request");

	SC=SC({
		addStorageDialog:"addStorageDialog",
		updateDialog:"updateDialog",
		Storage:"Storage",
		StorageBrowser:"StorageBrowser",
		blocked:"gui.blocked",
		loading:"gui.loading",
		jobList:"jobList"
	});

	let sort=new Intl.Collator(navigator.languages,{sensitivity:"base"}).compare

	let loadingElement=SC.loading.layered();
	document.body.appendChild(loadingElement);


	let storageTable;
	let browser;
	let jobList;


	request.json("rest/storage/warnings").then(warnings=>
	{
		if(Object.keys(warnings).length>0) alert("Warning!\n"+JSON.stringify(warnings,null,"\t"));

		browser=new SC.StorageBrowser([]);
		document.body.appendChild(browser.content);

		jobList=SC.jobList;
		jobList.connect();

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
			data=data.map(SC.Storage.fromJSON)
			.sort((a,b)=>sort(a.name,b.name));
			browser.setData(data);
		});
	};

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);
