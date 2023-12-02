

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
      const itemPrice = itemElement.querySelector('.item-price').textContent.substring(1); // Eliminar el símbolo de dólar

      console.log('Debug - Título del elemento:', itemTitle);
      console.log('Debug - Precio del elemento:', itemPrice); const itemDescription = itemElement.querySelector('.item-description').textContent;
      const itemType = event.target.closest('.menu-section').getAttribute('data-type');
      const imgElement = itemElement.querySelector('img');
      const itemImgUrl = imgElement ? imgElement.src : '';
      Swal.fire({
        title: 'Editar elemento',
        html:
          '<input id="swal-input1" class="swal2-input" placeholder="Nombre" value="' + itemTitle + '">' +
          '<input id="swal-input2" class="swal2-input" placeholder="Precio" value="' + itemPrice + '">' +
          '<input id="swal-input4" class="swal2-input" placeholder="Descripción" value="' + itemDescription + '">' +
          '<input id="swal-img-url" class="swal2-input" placeholder="URL de la imagen" value="' + itemImgUrl + '">' +
          '<select id="swal-input3" class="swal2-input">' +
          '<option value="ENTRADAS" ' + (itemType === 'ENTRADAS' ? 'selected' : '') + '>ENTRADAS</option>' +
          '<option value="PARA COMPARTIR" ' + (itemType === 'PARA COMPARTIR' ? 'selected' : '') + '>PARA COMPARTIR</option>' +
          '<option value="SANDWICHES" ' + (itemType === 'SANDWICHES' ? 'selected' : '') + '>SANDWICHES</option>' +
          '<option value="PIZZETAS" ' + (itemType === 'PIZZETAS' ? 'selected' : '') + '>PIZZETAS</option>' +
          '<option value="BEBIDAS SIN ALCOHOL" ' + (itemType === '' ? 'selected' : '') + '>BEBIDAS SIN ALCOHOL</option>' +
          '<option value="CERVEZAS" ' + (itemType === 'CERVEZAS' ? 'selected' : '') + '>CERVEZAS</option>' +
          '<option value="ESTILOS DE GIN" ' + (itemType === 'GIN' ? 'selected' : '') + '> ESTILOS DE GIN</option>' +
          '<option value="TRAGOS" ' + (itemType === 'TRAGOS' ? 'selected' : '') + '> TRAGOS</option>' +
          '</select>',
        showCancelButton: true,
        confirmButtonText: 'Actualizar',
        cancelButtonText: 'Eliminar'
      }).then((result) => {
        const updatedData = {
          nombre: document.getElementById('swal-input1').value,
          precio: document.getElementById('swal-input2').value,
          descripcion: document.getElementById('swal-input4').value,
          tipo: document.getElementById('swal-input3').value,
          img_url: document.getElementById('swal-img-url').value
        };


        if (result.isConfirmed) {
          console.log("ID del elemento a editar:", itemElement.dataset.id);
          fetch(`/api/menu/${itemElement.dataset.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(updatedData)
          }).then(response => response.json())
            .then(data => {
              if (data.changes > 0) {
                // El elemento se actualizó correctamente
                console.log('Elemento actualizado');
                // Actualizar el elemento en el frontend
                itemElement.querySelector('.item-title').textContent = updatedData.nombre;
                itemElement.querySelector('.item-price').textContent = `$${updatedData.precio}`;
                itemElement.querySelector('.item-description').textContent = updatedData.descripcion;


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
            });

        } else if (result.dismiss === Swal.DismissReason.cancel) {
          // Eliminar el elemento
          fetch(`/api/menu/${itemElement.dataset.id}`, {
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
        '<input id="swal-img-url" class="swal2-input" placeholder="URL de la imagen">' +
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
        return {
          nombre: document.getElementById('swal-input1').value,
          precio: document.getElementById('swal-input2').value,
          descripcion: document.getElementById('swal-input4').value,
          tipo: document.getElementById('swal-input3').value,
          img_url: document.getElementById('swal-img-url').value

        }
      }
    }).then((result) => {
      if (result.isConfirmed) {
        const newData = {
          nombre: document.getElementById('swal-input1').value,
          precio: document.getElementById('swal-input2').value,
          descripcion: document.getElementById('swal-input4').value,
          tipo: document.getElementById('swal-input3').value,
          img_url: document.getElementById('swal-img-url').value

        };

        // Crear el nuevo elemento en el servidor
        fetch('https://elpatio427.com.ar/api/menu', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(newData)
        }).then(response => response.json())
          .then(data => {
            if (data.id) {
              // El elemento se creó correctamente
              console.log('Elemento creado con ID:', data.id);

              // Verificar si la sección del menú ya existe
              let menuSection = document.querySelector(`.menu-section[data-type="${newData.tipo}"]`);

              // Si no existe, crearla
              if (!menuSection) {
                menuSection = document.createElement('div');
                menuSection.className = 'menu-section';
                menuSection.setAttribute('data-type', newData.tipo);
                // Aquí puedes añadir más elementos al menuSection si es necesario
                document.body.appendChild(menuSection);  // Añadir al lugar apropiado en el DOM
              }

              const newItem = createMenuItem(newData);
              menuSection.appendChild(newItem);
            }
          })


      }
    });
  });
// Añadir un evento click al botón "Crear Anuncio"
const createAnnouncementButton = document.getElementById('create-announcement-button');
if (createAnnouncementButton) {
  createAnnouncementButton.addEventListener('click', function () {
    fetch('/api/announcements') // Realiza la solicitud GET
      .then(response => response.json())
      .then(data => {
        let modalTitle = 'Crear Anuncio';
        let imageUrl = '';
        let text = '';
        let paragraph = '';
        let stateChecked = '';

        if (data.success && data.announcement) {
          // Si hay un anuncio activo, carga los datos en el modal
          modalTitle = 'Editar Anuncio';
          imageUrl = data.announcement.image_url || '';
          text = data.announcement.text || '';
          paragraph = data.announcement.paragraph || '';
          stateChecked = data.announcement.state ? 'checked' : '';
        }

        Swal.fire({
          title: modalTitle,
          html: `
            <input id="swal-image-url" class="swal2-input" placeholder="URL de la imagen" value="${imageUrl}">
            <input id="swal-text" class="swal2-input" placeholder="Texto del anuncio" value="${text}">
            <input id="swal-paragraph" class="swal2-input" placeholder="Párrafo del anuncio" value="${paragraph}">
            <span class="check"><input type="checkbox" id="swal-state" class="swal2-checkbox" ${stateChecked}> Activo</span>
          `,
          focusConfirm: false,
          preConfirm: () => {
            return {
              image_url: document.getElementById('swal-image-url').value,
              text: document.getElementById('swal-text').value,
              paragraph: document.getElementById('swal-paragraph').value,
              state: document.getElementById('swal-state').checked
            };
          }
        }).then((result) => {
          if (result.isConfirmed) {
            // Enviar los datos del anuncio al servidor
            fetch('/api/announcements', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(result.value)
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
        // Aquí puedes manejar el error o abrir el modal con campos vacíos
        Swal.fire({
          title: 'Crear Anuncio',
          html: `
            <input id="swal-image-url" class="swal2-input" placeholder="URL de la imagen">
            <input id="swal-text" class="swal2-input" placeholder="Texto del anuncio">
            <input id="swal-paragraph" class="swal2-input" placeholder="Párrafo del anuncio">
            <span class="check"><input type="checkbox" id="swal-state" class="swal2-checkbox"> Activo</span>
          `,
          focusConfirm: false,
          preConfirm: () => {
            return {
              image_url: document.getElementById('swal-image-url').value,
              text: document.getElementById('swal-text').value,
              paragraph: document.getElementById('swal-paragraph').value,
              state: document.getElementById('swal-state').checked
            };
          }
        });
      });
  });
}



  function loadAndShowActiveAnnouncement() {
    fetch('/api/announcements')
      .then(response => response.json())
      .then(data => {
        if (data.success && data.announcement && data.announcement.state) {
          // Mostrar el anuncio con SweetAlert2
          Swal.fire({
            title: data.announcement.text,
            html: `<p>${data.announcement.paragraph}</p>`, // Añade el párrafo del anuncio aquí
            imageUrl: data.announcement.image_url,
            imageWidth: 400,
            imageHeight: 200,
            imageAlt: 'Imagen del anuncio',
            confirmButtonText: 'OK'
          });
        }
      });
  }

  // Cargar y mostrar el anuncio activo al iniciar la aplicación
  loadAndShowActiveAnnouncement();
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
