function addScript(src) {
  return new Promise((resolve, reject) => {
    var script = document.createElement("script");
    script.onload = resolve;
    script.setAttribute("src", src);
    document.body.appendChild(script);
  });
}

/**
 * Initializes the hypothesis editor interface.
 * Triggered with ?edit=1 on the URL
 */
function initEditor(pageId) {
  // <script async src="https://hypothes.is/embed.js"></script>
  window.hypothesisConfig = function () {
    return {
      showHighlights: true,
    };
  };
  addScript("https://hypothes.is/embed.js");
}

/**
 * Initializes the custom UI for displaying annotations
 */
function initClient(pageId) {
  const setup = () => {
    getAnnotations(pageId, 0, []).then((rows) => {
      attachAnnotations(rows);
      initClientUI(rows);
    });
  };
  setup();
}

function makeCssFromUsernameState(usernameState) {
  return Object.keys(usernameState)
    .map((userId) => {
      return `.content--${userId} {
      display: ${usernameState[userId].on ? "inline" : "none"};
    }`;
    })
    .join("\n");
}

function initClientUI(rows) {
  var usernameState = {};
  rows.forEach((row) => {
    var userId = stripUsername(row.user);
    usernameState[userId] = {on: true, displayName: userId};
    try {
      if (row.user_info.display_name) {
        usernameState[userId].displayName = row.user_info.display_name;
      }
    } catch(e) {
    }
  });
  console.log(usernameState);

  var styleEl = document.createElement("style");
  // styleEl.type = "text/css";
  document.head.appendChild(styleEl);

  function updatePageCss(css) {
    styleEl.innerText = "";
    styleEl.appendChild(document.createTextNode(css));
  }

  window.updateDisplayState = () => {
    updatePageCss(makeCssFromUsernameState(usernameState));
  };

  window.updateDisplayState();

  // TODO generate toggles for each user
  var navEl = document.getElementById("nav");
  Object.keys(usernameState).forEach((userId) => {
    $(`<div class="color--${userId}">
      <label>
      <input type="checkbox" onclick="updateDisplayState" checked />
      ${usernameState[userId].displayName}
      </label>
    </div>`)
      .appendTo(navEl)
      .find("input")
      .change((e) => {
        usernameState[userId].on = e.target.checked; //== "checked" ? true : false;
        window.updateDisplayState();
      });
  });

  // Add base
  $(`<div class="base">
    <label>
      <input type="checkbox" onclick="toggle('.base', this)" checked />
        base
    </label>
    </div>`)
    .appendTo(navEl)
    .find("input")
    .change((e) => {
      $('.base--content').css('color', e.target.checked ? '' : 'transparent');
    });

  $("input.maxtickets_enable_cb")
    .change(function () {
      if ($(this).is(":checked")) $(this).next("span.max_tickets").show();
      else $("span.max_tickets").hide();
    })
    .change();
  function toggle(className, obj) {
    var $input = $(obj);
    if ($input.prop("checked")) $(className).show();
    else $(className).hide();
  }
}

function main() {
  var pageId = document.location.origin + document.location.pathname;
  var search = document.location.search;

  if (search.indexOf("edit=1") >= 0) {
    initEditor(pageId);
  } else {
    // Append /?edit=1 so we get annotations from edit page
    initClient(pageId + "?edit=1");
  }
}

main();
