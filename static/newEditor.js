var scene, camera, renderer;
var container = document.getElementById('canvas-container');
var raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2();
var selectedObject = null;
var currentMaterialType = null;
var selectedLight = null;

var containerWidth = container.clientWidth;
var containerHeight = container.clientHeight;

init();
render();

function init() {
    scene = new THREE.Scene();


    camera = new THREE.PerspectiveCamera(75, containerWidth / containerHeight, 0.1, 1000);
    camera.position.z = 500;

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerWidth, containerHeight);
    container.appendChild(renderer.domElement);

    const light = new THREE.PointLight(0xffffff, 1, 1000);
    light.position.set(10, 10, 10);
    scene.add(light);

    const ambientLight = new THREE.AmbientLight(0x404040); // soft white light
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(0, 0, 1);
    scene.add(directionalLight);


    window.addEventListener('resize', onWindowResize, false);
    renderer.domElement.addEventListener('click', onMouseClick, false);
}

function onMouseClick(event) {
    event.preventDefault();

    mouse.x = (event.clientX / renderer.domElement.clientWidth) * 2 - 1;
    mouse.y = -(event.clientY / renderer.domElement.clientHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    var intersects = raycaster.intersectObjects(scene.children, true);

    if (selectedObject) {
        selectedObject.material.opacity = 1; // Reset opacity if another object was selected
        selectedObject.material.transparent = false;
    }

    if (intersects.length > 0) {
        selectedObject = intersects[0].object;
        selectedObject.material.opacity = 0.5; // Set lower opacity for selected object
        selectedObject.material.transparent = true;

        // Update input fields to reflect the properties of the selected object
        document.getElementById('moveX').value = selectedObject.position.x.toFixed(2);
        document.getElementById('moveY').value = selectedObject.position.y.toFixed(2);
        document.getElementById('moveZ').value = selectedObject.position.z.toFixed(2);
        document.getElementById('rotateX').value = THREE.MathUtils.radToDeg(selectedObject.rotation.x).toFixed(2);
        document.getElementById('rotateY').value = THREE.MathUtils.radToDeg(selectedObject.rotation.y).toFixed(2);
        document.getElementById('rotateZ').value = THREE.MathUtils.radToDeg(selectedObject.rotation.z).toFixed(2);
        document.getElementById('scaleX').value = selectedObject.scale.x.toFixed(2);
        document.getElementById('scaleY').value = selectedObject.scale.y.toFixed(2);
        document.getElementById('scaleZ').value = selectedObject.scale.z.toFixed(2);
    } else {
        selectedObject = null;
        // Clear the input fields if no object is selected
        clearTransformationFields();
    }

    render();
}

function clearTransformationFields() {
    document.getElementById('moveX').value = '';
    document.getElementById('moveY').value = '';
    document.getElementById('moveZ').value = '';
    document.getElementById('rotateX').value = '';
    document.getElementById('rotateY').value = '';
    document.getElementById('rotateZ').value = '';
    document.getElementById('scaleX').value = '';
    document.getElementById('scaleY').value = '';
    document.getElementById('scaleZ').value = '';
}

function addMesh(type) {
    let geometry;
    const material = new THREE.MeshPhongMaterial({ color: 0x8AC });
    switch (type) {
        case 'cube':
            geometry = new THREE.BoxGeometry(100, 100, 100);
            break;
        case 'plane':
            geometry = new THREE.PlaneGeometry(100, 100);
            break;
        case 'sphere':
            geometry = new THREE.SphereGeometry(100, 100, 100);
            break;
        case 'cylinder':
            geometry = new THREE.CylinderGeometry(100, 100, 200, 100);
            break;
    }
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(0, 0, 0);
    scene.add(mesh);
    render();
}

function showTextOptions() {
    var textOptions = document.getElementById('textOptions');
    textOptions.style.display = 'block'; // Show the text input options
}

function addTextMesh() {
    const text = document.getElementById('text3dInput').value;
    const fontName = document.getElementById('fontSelector').value;
    const fontUrl = `https://threejs.org/examples/fonts/${fontName}_regular.typeface.json`;

    const loader = new THREE.FontLoader();
    loader.load(fontUrl, function (font) {
        const geometry = new THREE.TextGeometry(text, {
            font: font,
            size: 80, // Adjust size as needed
            height: 20, // Adjust depth as needed
            curveSegments: 12,
            bevelEnabled: false,
            bevelThickness: 1,
            bevelSize: 1,
            bevelSegments: 1
        });

        geometry.computeBoundingBox();
        geometry.computeVertexNormals();

        // Optional: Adjust text position to center
        const xMid = -0.5 * (geometry.boundingBox.max.x - geometry.boundingBox.min.x);
        const yMid = -0.5 * (geometry.boundingBox.max.y - geometry.boundingBox.min.y);
        geometry.translate(xMid, yMid, 0);

        const material = new THREE.MeshPhongMaterial({ color: 0xf03434 });
        const mesh = new THREE.Mesh(geometry, material);

        // Set position to center of the canvas
        mesh.position.set(0, 0, 0);

        scene.add(mesh);
        render();

        // Hide the options after adding the text
        document.getElementById('textOptions').style.display = 'none';
        // Optionally clear the input
        document.getElementById('text3dInput').value = '';
    }, undefined, function (error) {
        console.error('Font could not be loaded:', error);
    });
}

const fontUrls = {
    helvetiker: 'https://threejs.org/examples/fonts/helvetiker_regular.typeface.json',
    optimer: 'https://threejs.org/examples/fonts/optimer_regular.typeface.json',
    gentilis: 'https://threejs.org/examples/fonts/gentilis_regular.typeface.json',
    // Add new font mappings here
    font1: 'https://github.com/google-fonts-bower/poppins-bower/blob/master/bower.json',
    font2: 'https://yourcdn.com/path/to/font2.typeface.json'
};

function addTextMesh() {
    const text = document.getElementById('text3dInput').value;
    const fontName = document.getElementById('fontSelector').value;
    const fontUrl = fontUrls[fontName]; // Use the mapping

    const loader = new THREE.FontLoader();
    loader.load(fontUrl, function (font) {
        const geometry = new THREE.TextGeometry(text, {
            font: font,
            size: 80, // Adjust size as needed
            height: 20, // Adjust depth as needed
            curveSegments: 12,
            bevelEnabled: false
        });

        geometry.computeBoundingBox();
        geometry.computeVertexNormals();

        const xMid = -0.5 * (geometry.boundingBox.max.x - geometry.boundingBox.min.x);
        geometry.translate(xMid, 0, 0);

        const material = new THREE.MeshPhongMaterial({ color: 0xf03434 });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(0, 0, 0);
        scene.add(mesh);
        render();

        document.getElementById('textOptions').style.display = 'none';
        document.getElementById('text3dInput').value = '';
    }, undefined, function (error) {
        console.error('Font could not be loaded:', error);
    });
}

function updateTransform(transformType, axis, value) {
    if (!selectedObject) return;
    value = parseFloat(value);

    if (transformType === 'scale' && document.getElementById('uniformScale').checked) {
        // Calculate the scale difference as a factor based on the first changed value
        const oldValue = selectedObject.scale[axis];
        const scaleDiff = value / oldValue;

        // Apply the scale factor uniformly across all axes
        selectedObject.scale.x *= scaleDiff;
        selectedObject.scale.y *= scaleDiff;
        selectedObject.scale.z *= scaleDiff;

        // Update the input fields to reflect the new values
        document.getElementById('scaleX').value = selectedObject.scale.x.toFixed(2);
        document.getElementById('scaleY').value = selectedObject.scale.y.toFixed(2);
        document.getElementById('scaleZ').value = selectedObject.scale.z.toFixed(2);
    } else {
        // Apply the value to the specific axis
        selectedObject[transformType][axis] = value;

        // If it's rotation, convert the value from degrees to radians
        if (transformType === 'rotation') {
            selectedObject.rotation[axis] = THREE.MathUtils.degToRad(value);
        }
    }

    render(); // Re-render the scene with new transformations
}

function selectMaterialType(type) {
    currentMaterialType = type;
    document.getElementById('colorPicker').style.display = (type === 'color' ? 'block' : 'none');

    if(type == 'texture'){
        document.getElementById('texture-input-btn').style.display = 'block';
    }
    else{
        document.getElementById('texture-input-btn').style.display = 'none';
    }


}

function applyColor(color) {
    if (!selectedObject) return;
    // When setting a color, ensure the texture map is removed
    selectedObject.material = new THREE.MeshPhongMaterial({
        color: color,
        map: null // Remove any texture map that might be applied
    });
    render();
}

function applyTexture(input) {
    if (!selectedObject || !input.files || input.files.length === 0) return;

    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = function (e) {
        const textureLoader = new THREE.TextureLoader();
        textureLoader.load(
            e.target.result,
            function (texture) {
                selectedObject.material = new THREE.MeshPhongMaterial({
                    map: texture,
                    color: 0xffffff // Reset color to white to avoid coloring the texture
                });
                selectedObject.material.needsUpdate = true; // Ensure the material updates
                render();
            },
            undefined, // onProgress not handled
            function (error) {
                console.error('Error loading texture:', error);
            }
        );
    };
    reader.onerror = function (event) {
        console.error("File could not be read! Code " + event.target.error.code);
    };
    reader.readAsDataURL(file); // Read the file as Data URL for use with TextureLoader
}

function duplicateSelectedObject() {
    if (!selectedObject) return;

    // Clone the selected object
    const clone = selectedObject.clone();

    // Modify the position along x-axis
    clone.position.x += 50;

    // Update selection to the new object
    selectedObject.material.opacity = 1;  // Reset old selection visibility if needed
    selectedObject = clone;
    selectedObject.material.opacity = 0.5;  // Highlight new selected object

    // Add the clone to the scene
    scene.add(clone);



    // Update transformation UI for the new selected object
    updateTransformationFields(selectedObject);

    render();
}

function deleteSelectedObject() {
    if (!selectedObject) return;

    // Remove from the scene
    scene.remove(selectedObject);

    // Clear any references to the object
    selectedObject = null;

    // Clear UI fields since there's no selected object
    clearTransformationFields();

    render();
}

function customFields(){
    var customDiv = document.getElementById('CamFields');
    
    if(customDiv.checked){
        customDiv.style.display = 'block';
    }
    else{
        customDiv.style.display = 'none';
    }
}

function updateCameraPosition(preset) {
    
    switch (preset) {
        case 'custom':
            const customInputs = document.querySelectorAll('#cameraControlForm input[type="number"]');
            const isEnabled = document.getElementById('customCamera').checked;
            customInputs.forEach(input => input.disabled = !isEnabled);
            document.getElementById('CamFields').style.display = 'block';
            break;
        case 'front':
            camera.position.set(0, 0, 500);
            document.getElementById('CamFields').style.display = 'none';
            break;
        case 'back':
            camera.position.set(0, 0, -500);
            document.getElementById('CamFields').style.display = 'none';
            break;
        case 'left':
            camera.position.set(-500, 0, 0);
            document.getElementById('CamFields').style.display = 'none';
            break;
        case 'right':
            camera.position.set(500, 0, 0);
            document.getElementById('CamFields').style.display = 'none';
            break;
        case 'top':
            camera.position.set(0, 500, 0);
            document.getElementById('CamFields').style.display = 'none';
            break;
        case 'bottom':
            camera.position.set(0, -500, 0);
            document.getElementById('CamFields').style.display = 'none';
            break;
    }
    camera.lookAt(scene.position);
    render();
}

function setCustomCamera() {
    const x = parseFloat(document.getElementById('cameraX').value) || 0;
    const y = parseFloat(document.getElementById('cameraY').value) || 0;
    const z = parseFloat(document.getElementById('cameraZ').value) || 0;
    camera.position.set(x, y, z);
    camera.lookAt(scene.position);
    render();
}

function deleteSelectedObject() {
    if (!selectedObject) return;

    // Remove from the scene
    scene.remove(selectedObject);

    // Clear any references to the object
    selectedObject = null;

    // Clear UI fields since there's no selected object
    clearTransformationFields();

    render();
}

function duplicateSelectedObject() {
    if (!selectedObject) return;

    // Clone the selected object
    const clone = selectedObject.clone();

    // Modify the position along x-axis
    clone.position.x += 50;

    // Add the clone to the scene
    scene.add(clone);

    // Update selection to the new object
    selectedObject.material.opacity = 1;  // Reset old selection visibility if needed
    selectedObject = clone;
    selectedObject.material.opacity = 0.5;  // Highlight new selected object

    // Update transformation UI for the new selected object
    updateTransformationFields(selectedObject);

    render();
}

var duplicatedCamera = null;

// Render image
updateAspectRatio();
updateImageSize();

function updateAspectRatio() {
    var aspectRatio = document.getElementById('aspectRatioSelect').value;
    var customAspectRatio = document.getElementById('customAspectRatio');
    if (aspectRatio === 'custom') {
        customAspectRatio.style.display = 'flex';
    } else {
        customAspectRatio.style.display = 'none';
    }
    applyAspectRatio(aspectRatio);
    calculateTotalPixels();
}

function applyAspectRatio(aspectRatio) {
    var aspectRatioArray = aspectRatio.split(':');
    var width = parseInt(aspectRatioArray[0]);
    var height = parseInt(aspectRatioArray[1]);
    if (aspectRatio === 'custom') {
        width = parseInt(document.getElementById('customAspectRatioX').value);
        height = parseInt(document.getElementById('customAspectRatioY').value);
    }
    if (duplicatedCamera) {
        duplicatedCamera.aspect = width / height;
        duplicatedCamera.updateProjectionMatrix();
    }
}

function updateImageSize() {
    calculateTotalPixels();
}

function calculateTotalPixels() {
    var imageSizeMultiplier = parseInt(document.getElementById('imageSizeSelect').value);
    var aspectRatio = document.getElementById('aspectRatioSelect').value;
    var customAspectRatio = document.getElementById('customAspectRatio');
    var width, height;
    if (aspectRatio === 'custom') {
        width = parseInt(document.getElementById('customAspectRatioX').value);
        height = parseInt(document.getElementById('customAspectRatioY').value);
    } else {
        var aspectRatioArray = aspectRatio.split(':');
        width = parseInt(aspectRatioArray[0]);
        height = parseInt(aspectRatioArray[1]);
    }
    var totalPixels = width * imageSizeMultiplier + "px by " + height * imageSizeMultiplier + "px";
    document.getElementById('totalPixelsDisplay').innerText =  totalPixels;
}

function renderAndDownload() {
    var aspectRatio = document.getElementById('aspectRatioSelect').value;
    var imageSizeMultiplier = parseInt(document.getElementById('imageSizeSelect').value);
    if (!duplicatedCamera) {
        duplicatedCamera = camera.clone();
        scene.add(duplicatedCamera);
    }
    applyAspectRatio(aspectRatio);
    calculateTotalPixels();
    render();
    downloadImage(aspectRatio, imageSizeMultiplier);
}

function downloadImage(aspectRatio, imageSizeMultiplier) {
    var canvas = document.createElement('canvas');
    var aspectRatioArray = aspectRatio.split(':');
    var width = parseInt(aspectRatioArray[0]) * imageSizeMultiplier;
    var height = parseInt(aspectRatioArray[1]) * imageSizeMultiplier;
    canvas.width = width;
    canvas.height = height;
    var context = canvas.getContext('2d');
    context.drawImage(renderer.domElement, 0, 0, width, height);
    canvas.toBlob(function (blob) {
        var link = document.createElement('a');
        link.download = "3D_Image.png";
        link.href = URL.createObjectURL(blob);
        link.click();
    });
    if (duplicatedCamera) {
        scene.remove(duplicatedCamera);
        duplicatedCamera = null;
    }
}

// Export 3d scene
function exportScene(format) {
    var exporter;
    switch(format) {
      case 'obj':
        exporter = new THREE.OBJExporter();
        var result = exporter.parse(scene);
        downloadString(result.obj, 'scene.obj', 'text/plain');
        downloadString(result.mtl, 'scene.mtl', 'text/plain');
        break;
      case 'fbx':
        if (!THREE.FBXExporter) {
          console.error('FBXExporter not available.');
          return;
        }
        exporter = new THREE.FBXExporter();
        var fbxData = exporter.parse(scene);
        downloadArrayBuffer(fbxData, 'scene.fbx', 'application/octet-stream');
        break;
      case 'glb':
        exporter = new THREE.GLTFExporter();
        var options = {
          binary: true
        };
        exporter.parse(scene, function(gltf) {
          var blob = new Blob([gltf], { type: 'model/gltf-binary' });
          downloadBlob(blob, 'scene.glb');
        }, options);
        break;
      default:
        console.error('Unsupported format');
        return;
    }
  }
  
  function downloadString(text, filename, type) {
    var blob = new Blob([text], { type: type });
    var link = document.createElement('a');
    link.style.display = 'none';
    link.download = filename;
    link.href = URL.createObjectURL(blob);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
  
  function downloadArrayBuffer(arrayBuffer, filename, type) {
    var blob = new Blob([arrayBuffer], { type: type });
    var link = document.createElement('a');
    link.style.display = 'none';
    link.download = filename;
    link.href = URL.createObjectURL(blob);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
  
  function downloadBlob(blob, filename) {
    var link = document.createElement('a');
    link.style.display = 'none';
    link.download = filename;
    link.href = URL.createObjectURL(blob);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
  
  












function onWindowResize() {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
    render();
}

function render() {
    renderer.render(scene, camera);
}

window.addEventListener('resize', onWindowResize);
