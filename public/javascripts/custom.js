$(function(){
  
    $('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
        $('a[data-toggle="tab"]').removeClass('btn-primary');
        $('a[data-toggle="tab"]').addClass('btn-default');
        $(this).removeClass('btn-default');
        $(this).addClass('btn-primary');
    });

    $('.next').click(function(){
        var nextId = $(this).parents('.tab-pane').next().attr("id");
        $('[href=#'+nextId+']').tab('show');
    });
  
    $('[data-toggle="popover"]').popover();

    $('.prev').click(function(){
        var prevId = $(this).parents('.tab-pane').prev().attr("id");
        $('[href=#'+prevId+']').tab('show');
    });
  
//    $('select[name="referralType"]').change(populateProviderList);
//    $('select[name="referralCategory"]').change(populateProviderList);
  
    $('#populateProviders').click(populateProviderList);

    $('#submitWizard').click(function(){
      

      // Serialize data to post method
      var datastring = $("#simpleForm").serialize();
      console.log(datastring);
      $.ajax({
        type: "POST",
        url: "/pcp/referral",
        data: datastring,
        success: saveReferral,
        error: function (error){ console.log(error); alert("Unable to Send Referral, Please try again")}
      });
    });
  
  function populateProviderList(){
    var params = {
      referralCategory : $('select[name="referralCategory"]').val(),
      referralType : $('select[name="referralType"]').val(),
      requiredServices: $('select[name="requiredServices[]"]').val()
    };
    console.log(params);
    $.ajax({
        type: "GET",
        url: "/pcp/ref/providers",
        data: params,
        success: function(providers) {
          var selectProvider = $('select[name="provider"]');
          
          providers.sort(function(a, b){
            if(a.rankSum > b.rankSum)
              return -1;
            else if(b.rankSum > a.rankSum)
              return 1;
            else
              return 0;
          });
          console.table(providers, ['name', 'providerRankSum', 'patientRankSum', 'rankSum']);
          
          var data_content = createEvalTable(providers);
          $('[data-toggle="popover"]').attr('data-content', data_content);
          
          selectProvider.html('<option id="optionHead"> Populating Provider List</option>');
          selectProvider.prop('disabled', true);
          providers.forEach(function(provider, index){
            selectProvider.append(appendToolTip(provider, index));
          });
          selectProvider.prop('disabled', false);
          $('#optionHead').html('Select Provider');
        },
        error: function (error){
          console.log(error);
        }
    });
  }
  
  function createEvalTable(providers){
    var pages = providers.length/5;
    var htmlContent  = "<table><thead>";
    htmlContent += "<th>Index<th>";
    htmlContent += "<th>Name<th>";
    htmlContent += "<th>ProviderRankSum<th>";
    htmlContent += "<th>PatientRankSum<th>";
    htmlContent += "<th>RankSum<th>";
    htmlContent += "</thead><tbody>";
        
    providers.forEach(function(provider, index){
      htmlContent += "<tr>";
      htmlContent += "<td>" + index + "</td>";
      htmlContent += "<td>" + provider.name + "</td>";
      htmlContent += "<td>" + provider.providerRankSum + "</td>";
      htmlContent += "<td>" + provider.patientRankSum + "</td>";
      htmlContent += "<td>" + provider.rankSum + "</td>";
      htmlContent += "</tr>";
    });
    htmlContent += "</tbody></table>";
    return htmlContent
  }
  
  function saveReferral(response){
    console.log(response);
    if(response.status == 'error')
      alert("Unable to Send Referral, Please try again")
    else{
      $('#referralModal').modal('hide');
      alert("Referral Successfully sent");
    }
  }
  
  function appendToolTip(provider, index){
    var i = index + 1;
    var option = '<option data-toggle="tooltip" data-placement="right"';
    option += 'title="Feedback RankValue='+(provider.patientRankSum).toFixed(2)+', Provider RankValue='+(provider.providerRankSum).toFixed(2);
    
    option += '"value="' + provider._id +'"> ' + i + " " + provider.name + '</option>'
    return option;
  }
  
  $('#sendRef').click(function(){
    
    var pcpId = $('#pcp').val();
    var referralId = $('#referralId').text();
    console.log(pcpId);
    
    var params = {
      referralId: referralId,
      pcpId: pcpId
    };
    
    $.ajax({
        type: "POST",
        url: "/admin/send/referral",
        data: params,
        success: function(response){
          console.log(response);
          $('#sendBox').html("");
          alert("Referral sent to physician");
        },
        error: function (error){ console.log(error); alert("Unable to Send Referral, Please try again")}
      });
  });

});
