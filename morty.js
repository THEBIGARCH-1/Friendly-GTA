import * as THREE from 'three';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const geometry = new THREE.SphereGeometry(1.5, 32, 32);
const positionAttribute = geometry.attributes.position;

const canvas = document.createElement('canvas');
canvas.width = 512;
canvas.height = 512;
const ctx = canvas.getContext('2d');
ctx.fillStyle = '#ffdf00';
ctx.fillRect(0, 0, 512, 512);
ctx.fillStyle = '#ffffff';
ctx.beginPath(); ctx.arc(180, 200, 40, 0, Math.PI * 2); ctx.fill();
ctx.beginPath(); ctx.arc(332, 200, 40, 0, Math.PI * 2); ctx.fill();
ctx.fillStyle = '#000000';
ctx.beginPath(); ctx.arc(185, 200, 15, 0, Math.PI * 2); ctx.fill();
ctx.beginPath(); ctx.arc(327, 200, 15, 0, Math.PI * 2); ctx.fill();
ctx.lineWidth = 8;
ctx.beginPath(); ctx.arc(256, 320, 80, 0, Math.PI, false); ctx.stroke();

const texture = new THREE.CanvasTexture(canvas);
const material = new THREE.MeshBasicMaterial({ map: texture });
const mortyMesh = new THREE.Mesh(geometry, material);
scene.add(mortyMesh);

const originalPositions = [];
const currentVelocities = [];

for (let i = 0; i < positionAttribute.count; i++) {
    originalPositions.push(new THREE.Vector3(
        positionAttribute.getX(i),
        positionAttribute.getY(i),
        positionAttribute.getZ(i)
    ));
    currentVelocities.push(new THREE.Vector3(0, 0, 0));
}

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2(-999, -999);
let isDragging = false;
let intersectedVertexIndex = -1;

window.addEventListener('pointermove', (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
});

window.addEventListener('pointerdown', () => { isDragging = true; });
window.addEventListener('pointerup', () => { 
    isDragging = false; 
    intersectedVertexIndex = -1;
});

const springConstant = 0.08;
const damping = 0.04;
const mousePullStrength = 0.4;

function animate() {
    requestAnimationFrame(animate);

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(mortyMesh);

    if (isDragging && intersects.length > 0) {
        if (intersectedVertexIndex === -1) {
            intersectedVertexIndex = intersects[0].face.a;
        }
    }

    for (let i = 0; i < positionAttribute.count; i++) {
        const p = new THREE.Vector3(
            positionAttribute.getX(i),
            positionAttribute.getY(i),
            positionAttribute.getZ(i)
        );
        const orig = originalPositions[i];
        const vel = currentVelocities[i];

        const displacement = p.clone().sub(orig);
        const springForce = displacement.clone().multiplyScalar(-springConstant);
        const dampingForce = vel.clone().multiplyScalar(-damping);

        vel.add(springForce).add(dampingForce);

        if (isDragging && i === intersectedVertexIndex) {
            const targetPos = intersects[0].point.clone();
            mortyMesh.worldToLocal(targetPos);
            vel.add(targetPos.clone().sub(p).multiplyScalar(mousePullStrength));
        }

        p.add(vel);
        positionAttribute.setXYZ(i, p.x, p.y, p.z);
    }

    positionAttribute.needsUpdate = true;
    renderer.render(scene, camera);
}

animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
