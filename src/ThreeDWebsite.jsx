import React, { useRef, useEffect } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { TextGeometry } from "three/addons/geometries/TextGeometry.js";
import { FontLoader } from "three/addons/loaders/FontLoader.js";

const ThreeDWebsite = () => {
  const containerRef = useRef();

  useEffect(() => {
    // Set up scene
    const { scene, camera, renderer } = initScene(containerRef);

    const loader = new FontLoader();

    const font = loader.load(
      "/fonts/helvetiker_regular.typeface.json",

      // font loaded
      function (font) {
        setupScene(font, scene, camera, renderer, containerRef);
      },

      // progress
      function (xhr) {
        console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
      },

      function (err) {
        console.log("An error happened", err);
      }
    );

    return () => {
      window.removeEventListener("resize", () => {});
      containerRef.current.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={containerRef} />;
};

export default ThreeDWebsite;

function setupScene(font, scene, camera, renderer, containerRef) {
  /*
  const textMesh = createTextMesh(textToRender, font);
  scene.add(textMesh);

  const textMesh2 = createTextMesh(`some other text`, font);
  scene.add(textMesh2);
  */

  const textContents = [
    { content: "Hey! I'm Manuel.", size: 40 },
    { content: "", size: 20 },
    { content: "", size: 20 },
    { content: "My projects", size: 40 },
    { content: "• Renderer From Scratch", size: 20 },
    { content: "• Gym Tracking App", size: 20 },
    { content: "", size: 20 },
    { content: "", size: 20 },
    { content: "More to come :3", size: 20 },
  ];

  const textMeshes = textContents.map((textObj, index) => {
    const textMesh = createTextMesh(font, textObj.content, textObj.size);

    // Position the text meshes in a row
    textMesh.position.y = index * -40;

    scene.add(textMesh);

    const boundingBox = new THREE.Box3().setFromObject(textMesh);
    const dimensions = new THREE.Vector3();
    boundingBox.getSize(dimensions);
    const boxGeometry = new THREE.BoxGeometry(
      dimensions.x,
      dimensions.y,
      dimensions.z
    );

    const boundingBoxMesh = new THREE.Mesh(
      boxGeometry,
      new THREE.MeshBasicMaterial({ visible: false })
    );
    boundingBoxMesh.position.copy(boundingBox.getCenter(new THREE.Vector3()));

    scene.add(boundingBoxMesh);

    return { textMesh: textMesh, boundingMesh: boundingBoxMesh };
  });

  //const cubeMesh = createCubeMesh(40, 40, 40, 0, 120, 0);
  //scene.add(cubeMesh);

  const torusKnot = createTorusMesh(0, 80, 0);
  scene.add(torusKnot);

  const boundingBox = calculateBoundingBox([
    ...textMeshes.map((meshObj) => meshObj.textMesh),
    torusKnot,
  ]);

  // add orbit controls
  const controls = setupCamera(boundingBox, camera, containerRef);

  handleWindowResize(camera, renderer);

  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  // add text hover effect
  handleTextHover(textMeshes, raycaster, mouse, camera);

  const animate = () => {
    requestAnimationFrame(animate);

    // add whatever transformations you want here
    torusKnot.rotation.x += 0.04;
    torusKnot.rotation.y += 0.04;

    controls.update();

    renderer.render(scene, camera);
  };

  // Animation loop
  animate(controls);
}

function handleTextHover(textMeshes, raycaster, mouse, camera) {
  const handleMouseMove = (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1; // invert y coords

    raycaster.setFromCamera(mouse, camera);

    for (let textMeshObj of textMeshes) {
      const intersect = raycaster.intersectObject(textMeshObj.boundingMesh);

      if (intersect.length > 0) {
        textMeshObj.textMesh.material.color.set(0xff0000); // Change color to red (you can set any color you want)
      } else {
        textMeshObj.textMesh.material.color.set(0x000000); // Change back to original color
      }
    }
  };

  window.addEventListener("mousemove", handleMouseMove);
}

function createTextMesh(font, textToRender, fontSize) {
  const textGeometry = new TextGeometry(textToRender, {
    font: font,
    size: fontSize,
    height: 2,
    curveSegments: 20,
    bevelEnabled: false,
  });

  // Center the text
  textGeometry.computeBoundingBox();
  const textBoundingBox = textGeometry.boundingBox;
  const textWidth = textBoundingBox.max.x - textBoundingBox.min.x;
  textGeometry.translate(-textWidth / 2, 0, 0);

  const textMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
  const textMesh = new THREE.Mesh(textGeometry, textMaterial);
  return textMesh;
}

function handleWindowResize(camera, renderer) {
  window.addEventListener("resize", () => {
    const newWidth = window.innerWidth;
    const newHeight = window.innerHeight;

    camera.aspect = newWidth / newHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(newWidth, newHeight);
  });
}

function setupCamera(boundingBox, camera, containerRef) {
  const center = boundingBox.getCenter(new THREE.Vector3());
  const size = boundingBox.getSize(new THREE.Vector3());

  const maxSize = Math.max(size.x, size.y, size.z);
  const distance =
    maxSize / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)));

  camera.position.copy(center);
  camera.position.z += distance * 1.25;

  const controls = new OrbitControls(camera, containerRef.current);
  controls.target.copy(center);
  controls.update();

  return controls;
}

function calculateBoundingBox(meshObjects) {
  const boundingBox = new THREE.Box3();

  meshObjects.forEach((object) => {
    boundingBox.expandByObject(object);
  });

  return boundingBox;
}

function createCubeMesh(sizex, sizey, sizez, posx, posy, posz) {
  const cubeGeometry = new THREE.BoxGeometry(sizex, sizey, sizez);
  const cubeMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });

  // add outline to cube
  const edgesMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
  const edgesGeometry = new THREE.EdgesGeometry(cubeGeometry);
  const edges = new THREE.LineSegments(edgesGeometry, edgesMaterial);

  const cubeMesh = new THREE.Group();
  cubeMesh.add(new THREE.Mesh(cubeGeometry, cubeMaterial));
  cubeMesh.add(edges);
  cubeMesh.position.set(posx, posy, posz);
  return cubeMesh;
}

function createTorusMesh(posx, posy, posz) {
  const geometry = new THREE.TorusKnotGeometry(10, 3, 100, 16);
  const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });

  const edgesMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
  const edgesGeometry = new THREE.EdgesGeometry(geometry);
  const edges = new THREE.LineSegments(edgesGeometry, edgesMaterial);

  const torusMesh = new THREE.Group();
  torusMesh.add(new THREE.Mesh(geometry, material));
  torusMesh.add(edges);
  torusMesh.position.set(posx, posy, posz);

  return torusMesh;
}

function initScene(containerRef) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );

  const renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0xeeeeee);
  containerRef.current.appendChild(renderer.domElement);
  return { scene, camera, renderer };
}
