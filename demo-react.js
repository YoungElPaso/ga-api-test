// TODO: integrate pouchdb for client-side cache.
// TODO: other inline todos

function addQueryRes(queryResObject) {
  // Fake query object.
  var q = {
    _id: 'test',
    _q: {
      name: 'query result object',
      number: 1
    }
  };

  // Put it in the DB!
  db.put(q, function callback(err, result) {
   if (!err) {
     console.log('Successfully posted a todo!');
   }
 });
}

// Load analytics API, specify callback.
gapi.load('analytics', anLoaded);

// Callback once loaded analytics and then load visualization.
function anLoaded() {
  /**
  * Authorize the user immediately if the user has already granted access.
  * If no access has been created, render an authorize button inside the
  * element with the ID "embed-api-auth-container".
  */
  gapi.analytics.auth.authorize({
    container: 'embed-api-auth-container',
    clientid: clientId
  });




  // Load the visualization API and the corechart and table packages &
  // specify callback.
  google.load('visualization', '1', {nocss: true, packages: ['corechart',
  'table', 'line'],
  callback: visLoaded});
}

// Callback for when the visualization (charts) library loads. Everything else
// can now happen...
function visLoaded() {

  // TODO need to figure out how to detect if PouchDB.js is loaded...
  // Create a PouchDB db for local caching of GA queries after first run. Saves
  // on API query quota I guess.
  var qDb = new PouchDB('queries');
  var remoteCouch =  false;
  console.log(qDb);

  var DashPanelContainer = React.createClass({
    render: function() {
    return (
    <div className=''>
      <DashPanel data={this.props.data} />
    </div>
  );
  }
  });

  var DashPanel = React.createClass({
    getInitialState: function() {
      // TODO add pouchdb stuff to this so dont do query every time and see
      // if we have initialstate locally stored (i.e. cahced dataTable)

      for (var i = 0; i < panelData.length; i++) {

        // Set up the chart objects and then execute them (i.e. render them)
        // in react render below...

        if (panelData[i].q) {
          panelData[i].dataData =  new gapi.analytics.report.Data({
            query: panelData[i].q
          });
          // Go get the data from API.
          panelData[i].dataData.execute();
        }

      }
      return {data: this.props.data};
    },
    render: function() {
    var panelInfo = this.props.data.map(function(panel) {
      return (
        <div className='col-sm-12 col-lg-6'>
          <div className='panel panel-default'>
            <div className='panel-heading'>
              <div className='panel-title'>
                <h3>{panel.title}</h3>
              </div>
            </div>
            <PanelBody id={panel.id} chartData={panel.dataData}
              chartType={panel.type} chartAttributes = {panel.attr}/>
          </div>
        </div>
      );
    });

    return (
    <div>
      {panelInfo}
    </div>
  );

  }
  });

  var PanelBody = React.createClass({
    render: function() {
    return (
      <div className='panel-body'>
        <div id={this.props.id}>
        </div>
      </div>
  );
  },
    componentDidMount() {
      var t = this;

      // Have data, now make a chart...
      this.props.chartData.on('success', function(res) {

        // TODO make this a switch or read the type and create that dynamically.
        // Make a Table if its a table.
        if (t.props.chartType == 'table') {
          var chart = new
          google.visualization.Table(document.getElementById(t.props.id));
        }

        // Make a LineChart if that's what we want.
        // NB: using the 'Material' design version, so google.charts.Line,
        // not google.visualization.LineChart. Requires IE8+
        if (t.props.chartType == 'line') {
          var chart = new
          google.charts.Line(document.getElementById(t.props.id));
        }

        // Set the table (lol) or line.
        var dt = new google.visualization.DataTable(res.dataTable);

        // Change the name of some columns...
        if (t.props.chartAttributes) {
          dt.setColumnLabel(0, t.props.chartAttributes[0]);
          dt.setColumnLabel(1, t.props.chartAttributes[1]);
        }

        // Add data to the table...
        chart.draw(dt);
      });

    }

  });

  // Data for React. Definition of panel components, including DOM to mount to
  // title, chart type, query etc.
  // NB: the dataTable output param below is required,
  // and undocumented (I think)
  var panelData = [
    {
      id: 'chart-container-mobile',
      title: 'Top 10 Pages Ranked by Mobile Pageviews for Pages Containing "law" (last 30 days)',
      type: 'table',
      q: {
        ids: 'ga:52332745',
        metrics: 'ga:pageviews',
        dimensions: 'ga:pagePath',
        segment: 'gaid::-11',
        'start-date': '30daysAgo',
        'end-date': 'yesterday',
        sort: '-ga:pageviews',
        filters: 'ga:pagePath=@law',
        'max-results': 10,
        'output': 'dataTable'
      },
      attr: ['Page Path', 'Pageviews']
    },
    {
      id: 'chart-container-total',
      title: 'Pageviews Trend for McGill.ca (last 60 days)',
      type: 'line',
      q: {
        ids: 'ga:52332745',
        metrics: 'ga:pageviews',
        dimensions: 'ga:date',
        'start-date': '60daysAgo',
        'end-date': 'yesterday',
        'output': 'dataTable'
      },
      attr: ['Day', 'Pageviews']
    }
  ];

  // Fire up the React components. (Maybe dont need this, convenient though).

  function startReact() {
    ReactDOM.render(
      <DashPanelContainer data={panelData}/>,
      document.getElementById('panels')
    );
  }
  startReact();

}

