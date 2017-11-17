(function(µ,SMOD,GMOD,HMOD,SC){

	SC=SC({
		InputDialog:"gui.InputDialog",
		request:"request"
	});

	SMOD("addStorageDialog",function()
	{
		new SC.InputDialog(`
		<div class="addStorageDialog">
        	<label><span>Name</span><input name="name" type="text" required autofocus></label>
        	<label><span>Path</span><input name="path" type="text" required></label>
        </div>
        <div class="errorMessage"></div>
        `,{
			modal:true,
			actions:{
				OK:function(values)
				{
					this.content.disabled=true;
					return SC.request({
						url:"rest/storage/add",
						data:JSON.stringify(values)
					})
					.catch(error=>
					{
						µ.logger.error(error);
						this.content.disabled=false;
						this.content.querySelector(".errorMessage").textContent=error.response;
						return Promise.reject();
					});
				}
			}
		});
	})

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);