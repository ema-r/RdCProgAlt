function w3_open() {
    var x = document.getElementById("mySidebar");
    x.style.width = "300px";
    x.style.paddingTop = "10%";
    x.style.display = "block";
  }
      
  
  function w3_close() {
    document.getElementById("mySidebar").style.display = "none";
  }
      
  function openNav() {
    var x = document.getElementById("navDemo");
    if (x.className.indexOf("w3-show") == -1) {
      x.className += " w3-show";
    } else { 
      x.className = x.className.replace(" w3-show", "");
    }
  }
      
  (function() {
      
    function renderUserProfile({
      display_name,
      images,
      id,
      email,
      external_urls,
      href,
      country
      }) {
      return `<h1>Logged in as ${display_name}</h1>
              <div>
                <div><img width="150" src="${images[0].url}"></div>
                <div>
                  <dl>
                    <dt>Display name</dt><dd>${display_name}</dd>
                    <dt>Id</dt><dd>${id}</dd>
                    <dt>Email</dt><dd>${email}</dd>
                    <dt>Spotify URI</dt><dd><a href="${external_urls.spotify}">${external_urls.spotify}</a></dd>
                    <dt>Link</dt><dd><a href="${href}">${href}</a></dd>
                    <dt>Profile Image</dt><dd><a href="${images[0].url}">${images[0].url}</a></dd>
                    <dt>Country</dt><dd>${country}</dd>
                  </dl>
                </div>
              </div>`;
          }
      
          function renderOAuth({access_token, refresh_token}) {
            return `<h2>OAuth Info</h2>
              <dl>
                <dt>Access token</dt><dd class="text-overflow">${access_token}</dd>
                <dt>Refresh token</dt><dd class="text-overflow">${refresh_token}</dd>
              </dl>`;
          }
      
          const loginBlock = document.getElementById('loginSpotify');
          const loggedInBlock = document.getElementById('loggedinSpotify')
          const userProfilePlaceholder = document.getElementById('user-profile');
          const oauthPlaceholder = document.getElementById('oauth');
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
      
          let access_token = hashParams.get('access_token'),
              refresh_token = hashParams.get('refresh_token'),
              error = hashParams.get('error');
      
          if (error) {
            alert('There was an error during the authentication');
          } else {
            if (access_token) {
              oauthPlaceholder.innerHTML = renderOAuth({access_token, refresh_token});
      
              const headers = {
                'Authorization': 'Bearer ' +'${access_token}'
              };
      
              fetch('https://api.spotify.com/v1/me', {headers})
              .then(response => response.json())
              .then(response => {
                userProfilePlaceholder.innerHTML = renderUserProfile(response);
                loginBlock.style.display = 'none';
                loggedInBlock.style.display = 'unset';
              });
            } else {
              loginBlock.style.display = 'unset';
              loggedInBlock.style.display = 'none';
            }
      
            document.getElementById('obtain-new-token').addEventListener('click', () => {
              const params = new URLSearchParams({refresh_token});
            
      
              fetch(`/refresh_token?${params.toString()}`)
              .then(response => response.json())
              .then(response => {
                access_token = response.access_token;
                oauthPlaceholder.innerHTML = renderOAuth({access_token, refresh_token});
      });
    }, false);
   }
  })();
