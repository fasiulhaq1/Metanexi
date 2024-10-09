// Function to calculate the center of the viewport
function calculateViewportCenter() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const aspect = width / height;
    const fov = 75;
    const cameraZ = height / (2 * Math.tan(fov * Math.PI / 360));

    return { x: 0, y: 0, z: cameraZ }; // Center of the viewport in world coordinates
  }

  // Function to add a shape to the scene
  function addShape(type) {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('centeral_con').innerHTML = '';
    document.getElementById('centeral_con').appendChild(renderer.domElement);

    const center = calculateViewportCenter();
    camera.position.set(center.x, center.y, center.z);
    camera.lookAt(center.x, center.y, 0);

    let geometry, material, shape;

    switch (type) {
      case 'cube':
        geometry = new THREE.BoxGeometry();
        material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        shape = new THREE.Mesh(geometry, material);
        break;
      case 'sphere':
        geometry = new THREE.SphereGeometry();
        material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        shape = new THREE.Mesh(geometry, material);
        break;
      case 'cylinder':
        geometry = new THREE.CylinderGeometry();
        material = new THREE.MeshBasicMaterial({ color: 0x0000ff });
        shape = new THREE.Mesh(geometry, material);
        break;
      case 'plane':
        geometry = new THREE.PlaneGeometry();
        material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
        shape = new THREE.Mesh(geometry, material);
        break;
    }

    scene.add(shape);
    shape.position.set(center.x, center.y, 0);

    renderer.render(scene, camera);
  }

  // Function to add 3D text to the scene
  function addText() {
    document.getElementById('textInput').style.display = 'block';
  }

  // Function to add text object to the scene
  function addTextObject() {
    const textValue = document.getElementById('textValue').value;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('viewport').innerHTML = '';
    document.getElementById('viewport').appendChild(renderer.domElement);

    const center = calculateViewportCenter();
    camera.position.set(center.x, center.y, center.z);
    camera.lookAt(center.x, center.y, 0);

    const loader = new THREE.FontLoader();
    loader.load('https://cdn.jsdelivr.net/npm/three/examples/fonts/helvetiker_regular.typeface.json', function (font) {
      const geometry = new THREE.TextGeometry(textValue, {
        font: font,
        size: 1,
        height: 0.1
      });
      const material = new THREE.MeshBasicMaterial({ color: 0x000000 });
      const textObject = new THREE.Mesh(geometry, material);
      scene.add(textObject);
      textObject.position.set(center.x, center.y, 0);

      renderer.render(scene, camera);
    });

    document.getElementById('textInput').style.display = 'none';
  }

  // Initialize the scene with an empty viewport
  addShape();