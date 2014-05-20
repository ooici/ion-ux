/*
 * ux-renders.js
 *
 * The goal of this is to provide a javascript interface to modify a layout at page render.
 * There are several small tweaks that can be accomplished in this approach.
 */

/*
 * Data Product Face Page Render
 */
function DataProductRender() {
  this.id_map = {
    download_size: "#2163328",
    license_uri: "#2161194",
    stored_size: "#2163327",
    data_url: "#2164346",
    dup1: "#2163118",
    dup2: "#2164400",

  };
  this.styling();
  this.specsTab();

};

/*
 * Removes the stored size and license URI elements from the specifications
 * tab. Adds the units (MB) to the end of the Download Size label.
 */
DataProductRender.prototype.specsTab = function() {
  $(this.id_map.download_size + " .text-short-label").html("Download Size (MB)");
  $(this.id_map.stored_size).empty();
  $(this.id_map.license_uri).empty();
};

DataProductRender.prototype.styling = function() {
  var chart_elmt = $('.DataProduct .chart_ooi').first();
  chart_elmt.css({height: '350px', width: '100%'});
  // new IONUX.Views.Chart({resource_id: resource_id, el: chart_elmt}).render().el;
  chart_elmt.html('<iframe width="100%" height="100%" id="chart" src="/static/visualization/chart.html"></iframe>')
  
  var model_data = window.MODEL_DATA;
  // Todo: manually setting the ERDAP download link
  var data_url_html = $(this.id_map.data_url).html();
  $(this.id_map.data_url).html(
      replace_url_with_html_links(
        data_url_html,
        model_data.resource.ooi_product_name != '' ? model_data.resource.ooi_product_name : model_data.resource.name
  ));
  
  // Todo: find the cause of double content-wrapping on these two items
  $(this.id_map.dup1 + ' .content-wrapper:last').remove();
  $(this.id_map.dup2 + ' .content-wrapper:last').remove();
}


/*
 * Agent Instance Face Page Render
 */
function AgentInstanceRender() {
  this.header();
  this.settingsPanel();
};

/*
 * Wraps the header section of an AgentInstance face page with a resource type
 * div element so that styling can be applied through CSS.
 */
AgentInstanceRender.prototype.header = function () {
  $('.heading .AgentInstance').wrapInner(
          '<div class="' + window.MODEL_DATA.resource.type_ + '"></div>');
  
};

// Swap settings panel width
AgentInstanceRender.prototype.settingsPanel = function() {
  $('#2164806').toggleClass('span3').toggleClass('span5');
}

/*
 * Instrument Site Render
 */
function InstrumentSiteRender() {
  this.header();
};

// Wraps header with a resource type div element
InstrumentSiteRender.prototype.header = function () {
  $('.heading .InstrumentSite .heading-left .text-short-label').remove();
};

/*
 * Station Site Render
 */
function StationSiteRender() {
  this.header();
};

// Removes extra label and wraps header in resource type div element.
StationSiteRender.prototype.header = function() {
  $('.heading .StationSite .heading-left .text-short-label').remove();
  $('.heading .StationSite').wrapInner('<div class="' + window.MODEL_DATA.resource.type_ + '"></div>');
};

/*
 * User Info Render
 */
function UserInfoRender(resource_id) {
  this.header();
  this.model(resource_id);
};

// Joins first and last name in header
UserInfoRender.prototype.header = function () {
  // For some reason the first and last name are split in the header, one
  // is a left and the other a right header element, this removes all fo
  // that and fills in just the full name

  $('.heading .UserInfo .heading-left').empty();
  $('.heading .UserInfo .heading-left').append('<div class="level-zero text_short_ooi"><span>' + window.MODEL_DATA.resource.name + '</span></div>');
  $('.heading .UserInfo .heading-right').empty();
};


UserInfoRender.prototype.model = function(resource_id) {
  if(IONUX.SESSION_MODEL.get('user_id') == resource_id) {
    IONUX.SESSION_MODEL.fetch();
  }
};


/*
 * Device Model Render
 */
function DeviceModelRender() {
  this.header();
};

// Adds specific model info to the element
DeviceModelRender.prototype.header = function() {
  $('.heading .DeviceModel').wrapInner('<div class="' + window.MODEL_DATA.resource.type_ + '"></div>');
};

/*
 * Information Resource Render
 */
function InformationResourceRender() {
  this.header();
};

/*
 * Add a div element for the resource type for generic resources so that proper
 * theming can be applied
 */
InformationResourceRender.prototype.header = function() {
  $('.heading .InformationResource').wrapInner('<div class="' + window.MODEL_DATA.resource.type_ + '"></div>');
}

/*
 * Asset Render
 */
function AssetRender(read_write) {
  // Will need to get these group_labels from somewhere else.
  var group_labels = ['Identification','Specification','Procurement','Location','Status'];

  // Create a structure that will work for the viz.
  var rows = {};
  _.each(group_labels,function(o){
    rows[o] = [];
  });
  _.map(window.MODEL_DATA.asset_specification.attribute_specifications,function(v,k) {
    var value = (!_.isUndefined(window.MODEL_DATA.resource.asset_attrs[k]) && !_.isEmpty(window.MODEL_DATA.resource.asset_attrs[k]['value'])) ?
      window.MODEL_DATA.resource.asset_attrs[k]['value'] :
      v['default_value'];
    // input vs. div
    var field = read_write == 'write' ? 
      '<input class="span8" name="' + k + '" type="text"' + (v['editable'] != 'TRUE' ? ' disabled="disabled"' : '') + ' value="' + value + '">' :
      '<div class="span8 text-short-value">' + value + '</div>';
    if (v['visibility'] == 'TRUE') {
      rows[v['group_label']][v['rank'] * 1000] = 
        '<div class="level-zero text_short_ooi">' + '<div class="row-fluid">' +
          '<div class="span4 text-short-label"><a class="void" href="javascript:void(0)" title="' + v['description'] + '">' + v['attr_label'] + '</a></div>' + 
          field +
        '</div>' + '</div>';
    }
  });

  var l = [];
  if (read_write == 'write') {
    l.push(
      '<div class="' + 'edit' + ' block" style="margin-left:0px;">' + '<h3>' + 'Edit' + '</h3><div class="content-wrapper">' +
        '<div class="level-zero text_short_ooi">' + '<div class="row-fluid">' +
          '<button id="cancel-asset" class="span2 btn-general btn-cancel">Cancel</button>' +
          '<button id="save-asset" class="span2 btn-blue btn-save">Save</button>' +
        '</div></div>' +
      '</div></div>'
    );
  }
  _.each(group_labels,function(o){
    l.push('<div class="' + o + ' block" style="margin-left:0px;">' + '<h3>' + o + '</h3><div class="content-wrapper">');
    _.each(rows[o].sort(),function(j){
      l.push(j);
    });
    l.push('</div></div>');
  });

  console.dir(rows);

  // Create the group.
  var html = 
    '<ul class="nav nav-tabs">' + 
      '<li class="Resource active" style="display: list-item;"><a data-toggle="tab" href="#0">Attributes</a></li>' +
    '</ul>' +
    '<div class="tab-content">' +
      '<div class="tab-pane row-fluid active">' +
        l.join('') +
      '</div>' +
    '</div>';

  // Put this as the 1st panel, i.e. prepend to the 1st panel already on the page (or replace one if already exists).
  if ($('#asset_attrs_group').length > 0) {
    $('#asset_attrs_group').html(html);
  }
  else {
    html = '<div id="asset_attrs_group" class="group">' + html + '</div>';
    $('.v02,.span9').prepend(html);
    // Get rid of the standard Information panel.  And expand this new Attributes panel to the full width.
    $('.v01,.span3').remove();
    $('.v02,.span9').toggleClass('v02').toggleClass('v01').toggleClass('span9').toggleClass('span12');
  }

  if (read_write == 'write') {
    $('#save-asset').click(function(){
      j = JSON.parse(window.editResourceModel.get('asset_attrs'))
      _.each(window.MODEL_DATA.asset_specification.attribute_specifications,function(v,k){
        // If we just created an Asset through the UI, 'j' will be empty.  So build it as we go.
        if (!j[k]) {
          j[k] = {name : k,type_ : 'Attribute'};
        }
        j[k]['value'] = $('#asset_attrs_group input[name="' + k + '"]').val();
      });
      window.editResourceModel.set('asset_attrs',JSON.stringify(j))
      window.editResourceModel.save()
      IONUX.ROUTER.navigate(window.location.pathname.replace(/edit$/,''),{trigger:true})
    });
    $('#cancel-asset').click(function(){
      delete window.editResourceModel;
      IONUX.ROUTER.navigate(window.location.pathname.replace(/edit$/,''),{trigger:true})
    });
  }

  // I'm not sure if this is the right way to do this, but I'm a hacker.  So be it.
  // I only want the href for the title, so nuke all click activity.
  $('.void').click(function(e){e.stopImmediatePropagation()})
};
