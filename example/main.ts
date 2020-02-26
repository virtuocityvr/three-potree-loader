import { Vector3, Group } from 'three';
import { ClipMode, PointCloudOctree, PointColorType, PointSizeType } from '../src';
import { Viewer } from './viewer';

require('./main.css');

const topViewEl: HTMLDivElement = document.createElement('div');
topViewEl.className = 'container';
document.body.appendChild(topViewEl);

const perspectiveViewEl: HTMLDivElement = document.createElement('div');
perspectiveViewEl.className = 'container';
document.body.appendChild(perspectiveViewEl);

const viewer: Viewer = new Viewer();
viewer.initialize(topViewEl, perspectiveViewEl);

interface PointCloudsConfig {
  file: string;
  url: string;
  version: 'v1' | 'v2';
}
// let pointCloud: PointCloudOctree | undefined;
// let loaded: boolean = false;

const examplePointClouds: PointCloudsConfig[] = [
  {
    file: 'cloud.js',
    url: 'https://raw.githubusercontent.com/potree/potree/develop/pointclouds/lion_takanawa/',
    version: 'v1',
  },
  {
    file: 'metadata.json',
    url:
      'https://test-pix4d-cloud-eu-central-1.s3.eu-central-1.amazonaws.com/lion_takanawa_converted/',
    version: 'v2',
  },
];

interface PointClouds {
  [key: string]: PointCloudOctree | undefined;
}

interface LoadedState {
  [key: string]: boolean;
}

const pointClouds: PointClouds = {
  v1: undefined,
  v2: undefined,
};

const loaded: LoadedState = {
  v1: false,
  v2: false,
};

function createButton(text: string, onClick: () => void): HTMLButtonElement {
  const button: HTMLButtonElement = document.createElement('button');
  button.textContent = text;
  button.addEventListener('click', onClick);
  return button;
}

function createSlider(version: string): HTMLInputElement {
  const slider: HTMLInputElement = document.createElement('input');
  slider.type = 'range';
  slider.min = '10000';
  slider.max = '500000';
  slider.className = 'budget-slider';
  slider.addEventListener('change', () => {
    const cloud = pointClouds[version];
    if (!cloud) {
      return;
    }
    cloud.potree.pointBudget = parseInt(slider.value, 10);
    console.log(cloud.potree.pointBudget);
  });
  return slider;
}

function setupPointCloud(version: 'v1' | 'v2', file: string, url: string): void {
  if (loaded[version]) {
    return;
  }
  loaded[version] = true;

  viewer
    .load(file, url)
    .then(pco => {
      pointClouds[version] = pco;

      // Create a group for the point cloud
      const group = new Group();
      group.rotateX(-Math.PI / 2); // z is up in our point clouds

      // Set material properties
      pco.material.size = 1.0;
      pco.material.clipMode = ClipMode.CLIP_HORIZONTALLY;
      pco.material.clipExtent = [0.0, 0.0, 1.0, 1.0];
      pco.material.pointColorType = PointColorType.HEIGHT;
      pco.material.pointSizeType = PointSizeType.ATTENUATED;

      const camera = viewer.camera;
      camera.far = 1000;
      camera.updateProjectionMatrix();
      camera.position.set(0, 0, 10);
      camera.lookAt(new Vector3());

      group.add(pco);
      viewer.add(pco, group);
    })
    .catch(err => console.error(err));
}

function setupUI(cfg: PointCloudsConfig): void {
  const unloadBtn = createButton('Unload', () => {
    if (!loaded[cfg.version]) {
      return;
    }

    const pointCloud = pointClouds[cfg.version];
    if (!pointCloud) {
      return;
    }
    viewer.disposePointCloud(pointCloud);
    loaded[cfg.version] = false;
    pointClouds[cfg.version] = undefined;
  });

  const loadBtn = createButton('Load', () => setupPointCloud(cfg.version, cfg.file, cfg.url));

  const slider = createSlider(cfg.version);

  const btnContainer: HTMLDivElement = document.createElement('div');
  btnContainer.className = 'btn-container-' + cfg.version;
  document.body.appendChild(btnContainer);
  btnContainer.appendChild(unloadBtn);
  btnContainer.appendChild(loadBtn);
  btnContainer.appendChild(slider);
}

examplePointClouds.forEach(setupUI);

// Add "Window" button functionality from the new branch
const windowBtn = createButton('Window', () => {
  let child = open('', 'Some window', 'dependent')!;
  child.document.body.style.width = '100%';
  child.document.body.style.height = '100%';
  child.document.body.style.margin = '0';
  viewer.addWindowRenderer(child);
  console.log('window', child);
});

const windowBtnContainer: HTMLDivElement = document.createElement('div');
windowBtnContainer.className = 'btn-container-window';
document.body.appendChild(windowBtnContainer);
windowBtnContainer.appendChild(windowBtn);
