import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { marked } from 'marked';

const ThreeDWebsite = () => {
  const containerRef = useRef();

  useEffect(() => {
    // Set up scene
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0xeeeeee);
    containerRef.current.appendChild(renderer.domElement);

    const loader = new FontLoader();

    const font = loader.load(
      // resource URL
      '/fonts/optimer_regular.typeface.json',

      // onLoad callback
      function (font) {
        const markdownText = `
          # Hello Three.js

          This is a **Markdown** text rendered in 3D using Three.js.

          ## Features
          - 3D Text
          - Easy to customize
          - Supports Markdown
        `;

        const parsedMarkdown = marked.parse(markdownText, { sanitize: true });

        const textGeometry = new TextGeometry(`haiihai hai haihii hiiiiihiihihhi`, {
          font: font,
          size: 30,
          height: 2,
          curveSegments: 20,
          bevelEnabled: false,
          /*
          bevelThickness: 10,
          bevelSize: 8,
          bevelOffset: 0,
          bevelSegments: 5,
          */
        });

        // Center the text
        textGeometry.computeBoundingBox();
        const textBoundingBox = textGeometry.boundingBox;
        const textWidth = textBoundingBox.max.x - textBoundingBox.min.x;
        textGeometry.translate(-textWidth / 2, 0, 0);

        const textMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
        const textMesh = new THREE.Mesh(textGeometry, textMaterial);
        scene.add(textMesh);

        // Create a cube and position it above the text
        const cubeGeometry = new THREE.BoxGeometry(40, 40, 40);
        const cubeMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });

        // Create a material for the cube's edges (outlines)
        const edgesMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
        const edgesGeometry = new THREE.EdgesGeometry(cubeGeometry);
        const edges = new THREE.LineSegments(edgesGeometry, edgesMaterial);

        const cubeMesh = new THREE.Group();
        cubeMesh.add(new THREE.Mesh(cubeGeometry, cubeMaterial));
        cubeMesh.add(edges);
        cubeMesh.position.set(0, 120, 0); // Adjust the Y-coordinate to position it above the text
        scene.add(cubeMesh);

        // Combine bounding boxes
        const boundingBox = new THREE.Box3().setFromObject(textMesh);

        // List of additional objects to include in the bounding box
        const additionalObjects = [cubeMesh];

        // Union bounding boxes of additional objects
        additionalObjects.forEach((object) => {
          const objectBoundingBox = new THREE.Box3().setFromObject(object);
          boundingBox.union(objectBoundingBox);
        });

        // Calculate camera position to view the entire scene
        const center = boundingBox.getCenter(new THREE.Vector3());
        const size = boundingBox.getSize(new THREE.Vector3());

        const maxSize = Math.max(size.x, size.y, size.z);
        const distance = maxSize / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)));

        camera.position.copy(center);
        camera.position.z += distance;

        // Add orbit controls
        const controls = new OrbitControls(camera, renderer.domElement);

        // Handle window resize
        window.addEventListener('resize', () => {
        const newWidth = window.innerWidth;
        const newHeight = window.innerHeight;

        camera.aspect = newWidth / newHeight;
        camera.updateProjectionMatrix();

        renderer.setSize(newWidth, newHeight);
        });

        // Animation loop
        const animate = () => {
            requestAnimationFrame(animate);

            // Only rotate the cube, not the text
            cubeMesh.rotation.x += 0.01;
            cubeMesh.rotation.y += 0.01;

            controls.update();

            renderer.render(scene, camera);
        };

        animate();
      },

      // onProgress callback
      function (xhr) {
        console.log((xhr.loaded / xhr.total) * 100 + '% loaded');
      },

      // onError callback
      function (err) {
        console.log('An error happened', err);
      }
    );



    // Clean up
    return () => {
      window.removeEventListener('resize', () => {});
      containerRef.current.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={containerRef} />;
};

export default ThreeDWebsite;