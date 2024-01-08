

function checkAuthentication() {
  const token = localStorage.getItem('jwt');
  console.log("Token desde localStorage:", token);

  if (token) {
    console.log("Usuario autenticado. Mostrando botones...");  // Depuración

    // El usuario está autenticado
    document.querySelectorAll('.auth-required').forEach((elem) => {
      elem.style.display = 'inline-block';
    });
  } else {
    console.log("Usuario no autenticado. Ocultando botones...");  // Depuración
  }
}
document.addEventListener("DOMContentLoaded", function () {
  checkAuthentication();
  loadAndShowActiveAnnouncement();
  // Añadir un evento click al botón "Iniciar Sesión"
  document.getElementById('login-button').addEventListener('click', function () {
    Swal.fire({
      title: 'Sesión',
      html:
        '<input id="swal-username" class="swal2-input" placeholder="Usuario">' +
        '<input id="swal-password" type="password" class="swal2-input" placeholder="Contraseña">',
      focusConfirm: false,
      preConfirm: () => {
        return {
          username: document.getElementById('swal-username').value,
          password: document.getElementById('swal-password').value
        };
      }
    }).then((result) => {  // Asegúrate de que este bloque esté dentro de la llamada a Swal.fire
      if (result.isConfirmed) {
        // Enviar estas credenciales al servidor
        fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(result.value)
        })
          .then(response => response.json())
          .then(data => {
            console.log(data);
            if (data.auth) {
              localStorage.setItem('jwt', data.token);  // 
              console.log('Token almacenado:', localStorage.getItem('jwt'));  // Verificar si el token se almacenó
              window.location.reload();  // Recargar la página

            } else {
              console.log('Credenciales inválidas');
            }
          });
      }
    });
  });

  function loadMenuItems() {
    const localVersion = localStorage.getItem('menuVersion');
    // return fetch('http://localhost:3001/api/menuVersion')
    return fetch('https://elpatio427.com.ar/api/menuVersion')
      .then(response => response.json())
      .then(serverVersionData => {
        const serverVersion = serverVersionData.version;

        if (localVersion !== serverVersion) {
          // Si la versión del servidor es diferente, obtén los datos del menú desde el servidor
          return fetchMenuDataFromServer();
        } else {
          // Si no, usa los datos almacenados localmente
          const menuData = JSON.parse(localStorage.getItem('menuData'));
          renderMenuItems(menuData);
        }
      }); // Cierre de then() para fetch('/api/menuVersion')
  } // Cierre de loadMenuItems()
 
  function fetchMenuDataFromServer() {
    // return fetch(' http://localhost:3001/api/menu')
    return fetch('https://elpatio427.com.ar/api/menu')
      .then(response => response.json())
      .then(data => {
        localStorage.setItem('menuData', JSON.stringify(data.data));
        localStorage.setItem('menuVersion', data.version); // Asume que el servidor envía una 'versión'
        renderMenuItems(data.data);
      }); // Cierre de then() para fetch('/api/menu')
  } // Cierre de fetchMenuDataFromServer()

  function renderMenuItems(menuData) {
    const container = document.querySelector('.container');
    let currentType = null;

    menuData.forEach(item => {
      let menuSection = document.querySelector(`.menu-section[data-type="${item.tipo}"]`);

      if (!menuSection) {
        menuSection = document.createElement('div');
        menuSection.className = 'menu-section';
        menuSection.setAttribute('data-type', item.tipo);

        const itemTypeLower = item.tipo.toLowerCase();
        const isSpecialDrink = itemTypeLower === 'cervezas' ||
          itemTypeLower.includes('estilos de gin') ||
          itemTypeLower === 'bebidas sin alcohol' ||
          itemTypeLower === 'tragos';
        const sectionClass = isSpecialDrink ? 'special-drink-title' : '';

        if (currentType !== item.tipo) {
          const sectionTitle = document.createElement('h2');
          sectionTitle.className = `section-title ${sectionClass}`.trim();

          const titleText = document.createElement('span');
          titleText.textContent = item.tipo.toUpperCase();
          sectionTitle.appendChild(titleText);
          menuSection.appendChild(sectionTitle);

          if (itemTypeLower === 'sandwiches') {
            const subtitle = document.createElement('h3');
            subtitle.textContent = 'TODOS ACOMPAÑADOS CON PAPAS';
            subtitle.id = 'sandwiches-subtitle';
            menuSection.appendChild(subtitle);
          }

          currentType = item.tipo;
        } // Cierre del if (!menuSection)

        container.appendChild(menuSection);
      } // Cierre del if (!menuSection)

      const newItem = createMenuItem(item);
      menuSection.appendChild(newItem);
    }); // Cierre de forEach

    checkAuthentication();
  } // Cierre de renderMenuItems()



  function createMenuItem(item) {
    console.log("URL de la imagen:", item.img_url);
    const imageUrl = item.img_url || '';
    let imgTag = '';
    if (imageUrl) {
      imgTag = `<img src="${imageUrl}" alt="${item.nombre}" onerror="this.onerror=null; this.src='';" />`;
    }
    const newItem = document.createElement('div');
    newItem.className = 'menu-item';
    newItem.innerHTML = `
    <div class="item-header">
    ${imgTag}  <!-- Aquí va la etiqueta de la imagen si existe -->
  <h3 class="item-title">${item.nombre}</h3>
  <span class="item-price">$${item.precio}</span>
    
  </div>
  

     
    </div>
    <span class="item-containerp" ><p class="item-description">${item.descripcion}</p> </span>
    <button class="edit-button auth-required">Editar</button>
  `;
    newItem.dataset.id = item.id;
    return newItem;
  }





  document.body.addEventListener('click', function (event) {
    if (event.target.classList.contains('edit-button')) {
      const itemElement = event.target.closest('.menu-item');
      const itemTitle = itemElement.querySelector('.item-title').textContent;
      const itemPrice = itemElement.querySelector('.item-price').textContent.substring(1); // Elimina el símbolo del dólar
      const itemDescription = itemElement.querySelector('.item-description').textContent;
      const itemType = event.target.closest('.menu-section').getAttribute('data-type');
      const imgElement = itemElement.querySelector('img');
      const itemImgUrl = imgElement ? imgElement.src : '';
      Swal.fire({
        title: 'Editar elemento',
        showCloseButton: true, 
        html:
          '<input id="swal-input1" class="swal2-input" placeholder="Nombre" value=\'' + itemTitle + '\'/>' +
          '<input id="swal-input2" class="swal2-input" placeholder="Precio" value=\'' + itemPrice + '\'/>' +
          '<input id="swal-input4" class="swal2-input" placeholder="Descripción" value=\'' + itemDescription + '\'/>' +
          '<div id="image-preview-container">' +
          '<label for="swal-file-upload"></label>' + // Etiqueta para la carga de la imagen
          '<img id="current-image-preview" src=\'' + itemImgUrl + '\' style="max-width:300px;" onerror="this.style.display=\'none\'"/>' + // Miniatura de la imagen actual
          '</div>' +
          '<input type="file" id="swal-file-upload" class="swal2-input"/>' +
          '<select id="swal-input3" class="swal2-input">' +
          '<option value="ENTRADAS"' + (itemType === 'ENTRADAS' ? ' selected' : '') + '>ENTRADAS</option>' +
          '<option value="PARA COMPARTIR"' + (itemType === 'PARA COMPARTIR' ? ' selected' : '') + '>PARA COMPARTIR</option>' +
          '<option value="SANDWICHES"' + (itemType === 'SANDWICHES' ? ' selected' : '') + '>SANDWICHES</option>' +
          '<option value="PIZZETAS"' + (itemType === 'PIZZETAS' ? ' selected' : '') + '>PIZZETAS</option>' +
          '<option value="BEBIDAS SIN ALCOHOL"' + (itemType === '' ? ' selected' : '') + '>BEBIDAS SIN ALCOHOL</option>' +
          '<option value="CERVEZAS"' + (itemType === 'CERVEZAS' ? ' selected' : '') + '>CERVEZAS</option>' +
          '<option value="ESTILOS DE GIN"' + (itemType === 'GIN' ? ' selected' : '') + '>ESTILOS DE GIN</option>' +
          '<option value="TRAGOS"' + (itemType === 'TRAGOS' ? ' selected' : '') + '>TRAGOS</option>' +
          '</select>',

        showCancelButton: true,
        confirmButtonText: 'Actualizar',
        cancelButtonText: 'Eliminar'
      }).then((result) => {
        if (result.isConfirmed) {
          // Crear un objeto FormData y agregar los campos
          const formData = new FormData();
          formData.append('nombre', document.getElementById('swal-input1').value);
          formData.append('precio', document.getElementById('swal-input2').value);
          formData.append('descripcion', document.getElementById('swal-input4').value);
          formData.append('tipo', document.getElementById('swal-input3').value);

          // Agregar la imagen solo si se seleccionó un archivo
          const fileInput = document.getElementById('swal-file-upload');
          if (fileInput.files[0]) {
            formData.append('imagen', fileInput.files[0]); // Solo añade si se selecciona una nueva imagen
          }
      

          const itemId = itemElement.dataset.id; // Asegúrate de capturar el ID del elemento correctamente
          // Realizar la solicitud fetch con PUT y FormData
          // fetch(`http://localhost:3001/api/menu/${itemId}`, {
          fetch(`https://elpatio427.com.ar/api/menu/${itemId}`, {
            method: 'PUT',
            body: formData  // Usar FormData como cuerpo de la solicitud
          })
            .then(response => response.json())
            .then(data => {
              if (data.changes > 0) {
                // El elemento se actualizó correctamente
                console.log('Elemento actualizado');
                // Actualizar el elemento en el frontend
                itemElement.querySelector('.item-title').textContent = data.nombre || itemTitle;  // Utiliza el valor actualizado o el anterior si no se encuentra
                itemElement.querySelector('.item-price').textContent = `$${data.precio || itemPrice}`;
                itemElement.querySelector('.item-description').textContent = data.descripcion || itemDescription;

                let imgElement = itemElement.querySelector('img');
                if (updatedData.img_url) { // Si hay una nueva URL
                  if (imgElement) {
                    imgElement.src = updatedData.img_url;
                  } else {
                    imgElement = document.createElement('img');
                    imgElement.src = updatedData.img_url;
                    imgElement.alt = updatedData.nombre;
                    itemElement.querySelector('.item-header').appendChild(imgElement);
                  }
                } else if (imgElement) { // Si la URL está vacía y había una imagen
                  imgElement.remove();
                }

                const oldMenuSection = event.target.closest('.menu-section');
                const newMenuSection = document.querySelector(`.menu-section[data-type="${updatedData.tipo}"]`);
                if (oldMenuSection !== newMenuSection) {
                  oldMenuSection.removeChild(itemElement);
                  newMenuSection.appendChild(itemElement);
                }
              }
              const updatedData = data;
            });

        } else if (result.dismiss === Swal.DismissReason.cancel) {
          // Eliminar el elemento
          fetch(`https://elpatio427.com.ar/api/menu/${itemElement.dataset.id}`, {
            method: 'DELETE'
          }).then(response => response.json())
            .then(data => {
              if (data.deleted > 0) {
                // El elemento se eliminó correctamente
                console.log('Elemento eliminado');
                itemElement.remove();

              }
            });
        }
      });
    }
  });


  // Cargar los elementos del menú
  loadMenuItems();

  // Añadir un evento click al botón "Crear ítem"
  document.getElementById('create-item-button').addEventListener('click', function () {
    Swal.fire({
      title: 'Crear nuevo elemento',
      html:
        '<input id="swal-input1" class="swal2-input" placeholder="Nombre">' +
        '<input id="swal-input2" class="swal2-input" placeholder="Precio">' +
        '<input id="swal-input4" class="swal2-input" placeholder="Descripción">' +
        '<input type="file" id="swal-file-upload" class="swal2-input"> <!-- Campo de tipo file -->' +
        '<select id="swal-input3" class="swal2-input">' +
        '<option value="ENTRADAS">ENTRADAS</option>' +
        '<option value="PIZZETAS">PIZZETAS</option>' +
        '<option value="PARA COMPARTIR">PARA COMPARTIR</option>' +
        '<option value="SANDWICHES">SANDWICHES</option>' +
        '<option value=" SIN ALCOHOL">BEBIDAS SIN ALCOHOL</option>' +
        '<option value="CERVEZAS" >CERVEZAS</option>' +
        '<option value="ESTILOS DE GIN">ESTILOS DE GIN</option>' +
        '<option value="TRAGOS">TRAGOS</option>' +

        '</select>',
      focusConfirm: false,
      preConfirm: () => {
        const formData = new FormData();
        formData.append('nombre', document.getElementById('swal-input1').value);
        formData.append('precio', document.getElementById('swal-input2').value);
        formData.append('descripcion', document.getElementById('swal-input4').value);
        formData.append('tipo', document.getElementById('swal-input3').value);

        const fileInput = document.getElementById('swal-file-upload');
        if (fileInput.files[0]) {
          formData.append('imagen', fileInput.files[0]);
        }

        return formData; // Retorna el FormData para ser usado en el then
      }
    }).then((result) => {
      if (result.isConfirmed) {
        // result.value ya es un objeto FormData preparado en preConfirm
        fetch('https://elpatio427.com.ar/api/menu', {
          // fetch('http://localhost:3001/api/menu', {
          method: 'POST',
          body: result.value  // result.value es el objeto FormData
        })
          .then(response => response.json())
          .then(data => {
            if (data.id) {
              console.log('Elemento creado con ID:', data.id);

              // Verificar si la sección del menú ya existe
              let menuSection = document.querySelector(`.menu-section[data-type="${data.tipo}"]`);
              if (!menuSection) {
                menuSection = document.createElement('div');
                menuSection.className = 'menu-section';
                menuSection.setAttribute('data-type', data.tipo);
                document.body.appendChild(menuSection);
              }

              // Crea un nuevo elemento de menú en el DOM usando los datos recibidos del servidor
              const newItem = createMenuItem(data);
              menuSection.appendChild(newItem);
            }
          })
          .catch(err => {
            console.error('Error al crear elemento:', err);
          });
      }
    }); // Este cierra correctamente el bloque then
  })




  const createAnnouncementButton = document.getElementById('create-announcement-button');
  if (createAnnouncementButton) {

    createAnnouncementButton.addEventListener('click', function () {
      fetch('/api/announcements') // Sigue realizando la solicitud GET
        .then(response => response.json())
        .then(data => {
          let modalTitle = 'Crear Anuncio';
          let text = '';
          let paragraph = '';
          let stateChecked = '';
          let imageUrl = '';  // URL de la imagen del anuncio


          if (data.success && data.announcement) {
            // Si hay un anuncio activo, carga los datos en el modal
            modalTitle = 'Editar Anuncio';
            text = data.announcement.text || '';
            paragraph = data.announcement.paragraph || '';
            stateChecked = data.announcement.state ? 'checked' : '';
            imageUrl = data.announcement.image_url || '';  // Asegúrate de obtener la URL de la imagen correctamente

          }

          Swal.fire({
            title: modalTitle,
            showCloseButton: true, 

            html: `
          <img src="${imageUrl}" alt="Imagen Actual" id="current-image-preview" style="max-width:300px;" onerror="this.style.display='none'"/> <!-- Muestra la imagen actual -->
          <input type="file" id="swal-image-upload" class="swal2-input"> <!-- Para cargar una nueva imagen -->
          <input id="swal-text" class="swal2-input" placeholder="Texto del anuncio" value="${text}">
          <input id="swal-paragraph" class="swal2-input" placeholder="Párrafo del anuncio" value="${paragraph}">
          <span class="check"><input type="checkbox" id="swal-state" class="swal2-checkbox" ${stateChecked}> Activo</span>
          `,
            focusConfirm: false,
            preConfirm: () => {
              const formData = new FormData();
           
              formData.append('text', document.getElementById('swal-text').value);
              formData.append('paragraph', document.getElementById('swal-paragraph').value);
              formData.append('state', document.getElementById('swal-state').checked);
              const fileInput = document.getElementById('swal-image-upload');
              if (fileInput && fileInput.files.length > 0) {
                formData.append('image', fileInput.files[0]);
            }
              return formData; // Retorna el FormData para ser usado en el then
            }
          }).then((result) => {
            if (result.isConfirmed) {
              // Enviar los datos del anuncio al servidor como FormData
              fetch('/api/announcements', {
                method: 'POST',
                body: result.value  // Envia el objeto FormData
              })
                .then(response => response.json())
                .then(data => {
                  if (data.success) {
                    // Anuncio creado o actualizado correctamente
                    console.log('Anuncio creado/actualizado con ID:', data.id);
                  } else {
                    // Manejo de errores
                    console.log('Error al crear/actualizar el anuncio:', data.error);
                  }
                });
            }
          });
        })
        .catch(error => {
          console.error('Error al cargar el anuncio:', error);
        });
    });
  }


  function loadAndShowActiveAnnouncement() {
    console.log("Cargando anuncio activo");

    fetch('/api/announcements')
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`); // Lanza un error si la respuesta no es exitosa
        }
        return response.json(); // Parsea la respuesta como JSON
      })
      .then(data => {
        console.log("Datos recibidos para el anuncio activo:", data);

        if (data.success && data.announcement && data.announcement.state) {
          Swal.fire({
            title: data.announcement.text,
            html: `<p>${data.announcement.paragraph}</p>`,
            imageUrl: data.announcement.image_url,
            imageWidth: 400,
            imageHeight: 200,
            imageAlt: 'Imagen del anuncio',
            confirmButtonText: 'OK'
          });
        } else {
          console.log("No hay anuncio activo o el anuncio no está en estado activo.");
        }
      })
      .catch(error => {
        // Maneja cualquier error que ocurra durante la solicitud o procesamiento de datos
        console.error("Error al cargar el anuncio:", error);
        // Aquí podrías mostrar un mensaje al usuario o realizar alguna acción de recuperación
      });
  }



  // Cargar y mostrar el anuncio activo al iniciar la aplicación

});



// Función para cerrar la sesión
function simpleLogout() {
  localStorage.removeItem('jwt');  // Elimina el token JWT del almacenamiento local
  window.location.reload();  // Recarga la página
}

// Vincula la función al evento click del botón "Cerrar Sesión"
document.addEventListener("DOMContentLoaded", function () {
  const logoutButton = document.getElementById('logout-button');
  if (logoutButton) {  // Comprueba si el botón existe en la página
    logoutButton.addEventListener('click', simpleLogout);
  }
});
