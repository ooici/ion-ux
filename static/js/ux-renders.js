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





