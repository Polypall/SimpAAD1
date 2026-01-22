
import * as THREE from 'three';

/**
 * Generates an ASCII STL string from an array of Three.js Meshes
 */
export const generateSTL = (meshes: THREE.Mesh[]): string => {
  let stl = 'solid SimpAAD_Model\n';
  
  meshes.forEach((mesh) => {
    mesh.updateMatrixWorld();
    const geometry = mesh.geometry.toNonIndexed();
    const position = geometry.attributes.position;
    const normal = geometry.attributes.normal;
    
    for (let i = 0; i < position.count; i += 3) {
      const v1 = new THREE.Vector3().fromBufferAttribute(position, i).applyMatrix4(mesh.matrixWorld);
      const v2 = new THREE.Vector3().fromBufferAttribute(position, i + 1).applyMatrix4(mesh.matrixWorld);
      const v3 = new THREE.Vector3().fromBufferAttribute(position, i + 2).applyMatrix4(mesh.matrixWorld);
      
      const n = new THREE.Vector3().fromBufferAttribute(normal, i); // Approximate normal
      
      stl += `  facet normal ${n.x} ${n.y} ${n.z}\n`;
      stl += `    outer loop\n`;
      stl += `      vertex ${v1.x} ${v1.y} ${v1.z}\n`;
      stl += `      vertex ${v2.x} ${v2.y} ${v2.z}\n`;
      stl += `      vertex ${v3.x} ${v3.y} ${v3.z}\n`;
      stl += `    endloop\n`;
      stl += `  endfacet\n`;
    }
  });

  stl += 'endsolid SimpAAD_Model\n';
  return stl;
};

export const downloadSTL = (content: string, filename: string = 'simpaad_model.stl') => {
  const blob = new Blob([content], { type: 'application/sla' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};
