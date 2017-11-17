(function(µ,SMOD,GMOD,HMOD,SC){

	SC=SC({
		InputDialog:"gui.InputDialog",
		request:"request"
	});

	SMOD("updateDialog",function(name)
	{
		SC.request.json({
			url:"rest/storage/update",
			data:JSON.stringify({name:name})
		})
		.then(function(data)
		{
			new SC.InputDialog(`
			<table class="updateDialog">
				<thead>
					<tr>
						<th>New</th>
						<th>Changed</th>
						<th>Missing</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td class="compare new">${data.compare.new    .map(p=>"<div>"+p.join("/")+"</div>").join("\n")}</td>
						<td class="compare changed">${data.compare.changed.map(p=>"<div>"+p.join("/")+"</div>").join("\n")}</td>
						<td class="compare missing">${data.compare.missing.map(p=>"<div>"+p.join("/")+"</div>").join("\n")}</td>
					</tr>
				</tbody>
			</table>
			`,{
				modal:true,
				actions:{
					OK:function()
					{
						if(data.token)
						{
							this.content.disabled=true;
							return SC.request({
								url:"rest/storage/confirm/update",
								data:JSON.stringify({token:data.token})
							})
							.catch(error=>
							{
								µ.logger.error(error);
								alert(error.response);
							});
						}
					}
				}
			});
		},
		function(error)
		{
			alert(JSON.stringify(error.response,null,"\t"));
		});
	})

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);