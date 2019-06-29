(function () {
    var container,
        stats,
        camera,
        canvas,
        controls,
        scene,
        mouse = new THREE.Vector2(),
        renderer,
        raycaster,
        INTERSECTED;

    function initRenderer() {
        container = document.getElementById("canvas");
        renderer = new THREE.WebGLRenderer({
            alpha: true
        });
        renderer.setClearColor(0xffffff, 0);
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);
        container.appendChild(renderer.domElement);
        stats = new Stats();
        container.appendChild(stats.dom);
    }

    function initCamera() {
        camera = new THREE.PerspectiveCamera(
            20,
            window.innerWidth / window.innerHeight,
            1,
            20000
        );
        camera.position.z = 8000;
    }

    function initScene() {
        controls = new THREE.OrbitControls(camera, renderer.domElement);
        raycaster = new THREE.Raycaster();
        scene = new THREE.Scene();

        var ambientLight = new THREE.AmbientLight(0x1a1a1a);
        scene.add(ambientLight);

        var hemisphereLight = new THREE.HemisphereLight(0xc6c6c6, 0xa1a1a1, 1);
        scene.add(hemisphereLight);
    }

    function initCanvas() {
        canvas = document.createElement("canvas");
        canvas.width = 128;
        canvas.height = 128;
        var context = canvas.getContext("2d");
        context.fillRect(0, 0, canvas.width, canvas.height);
    }

    function addContributionCubes(contributions) {
        contributions
            .filter(contribution => contribution.count > 0)
            .forEach(contribution => {
                var sphereGeometry = new THREE.BoxGeometry(
                    (contribution.count + 3) * 10,
                    (contribution.count + 3) * 10,
                    (contribution.count + 3) * 10
                );
                var material = new THREE.MeshLambertMaterial({
                    color: new THREE.Color(contribution.color)
                });

                material.contributionData = {
                    date: contribution.date,
                    count: contribution.count
                };

                var mesh = new THREE.Mesh(sphereGeometry, material);

                mesh.position.set(
                    Math.floor(Math.random() * (1000 + 1000 + 1)) - 1000,
                    Math.floor(Math.random() * (1000 + 1000 + 1)) - 1000,
                    Math.floor(Math.random() * (1000 + 1000 + 1)) - 1000
                );
                scene.add(mesh);
            });
    }

    function initEventListeners() {
        window.addEventListener("resize", onWindowResize, false);
        window.addEventListener("mousemove", onMouseMove, false);
    }

    function onMouseMove() {
        event.preventDefault();
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    }

    function onWindowResize() {
        windowHalfX = window.innerWidth / 2;
        windowHalfY = window.innerHeight / 2;
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }

    function animate() {
        requestAnimationFrame(animate);
        handleIntersections();

        controls.update();
        stats.update();
        camera.lookAt(scene.position);
        renderer.render(scene, camera);
    }

    function injectStyles(elementId, stylesString) {
        var el = document.getElementById(elementId);
        el.setAttribute("style", stylesString)
    }

    function fetchUserData(userName) {
        showLoader();

        fetch(`https://github-contributions-api.now.sh/v1/${userName}`)
            .then(response => response.json())
            .then(data => {
                console.log(data);
                if (data.contributions.length > 1) {
                    injectStyles("landingScreen", "opacity: 0; pointer-events: none;");
                    init(data.contributions);
                } else {
                    injectStyles("error", "opacity: 1;");
                    hideLoader();
                }
            })
            .catch(error => {
                console.log("ERROR FETCHING: ", error);
            });
    }

    function handleContributionHover(contributionData) {
        var contributionText = document.getElementById("contributionText");

        contributionText.innerText = `${contributionData.count} ${
            contributionData.count > 1 ? "commits" : "commit"
        } on ${contributionData.date}`;

        injectStyles("contributionData", "opacity: 1;")
        injectStyles("canvas", "cursor: pointer;")
    }

    function handleContributionUnHover() {
        injectStyles("contributionData", "opacity: 0;")
        injectStyles("canvas", "cursor: move;")
    }

    function showLoader() {
        injectStyles("submit", "background: transparent; color: transparent;")
        injectStyles("loader", "display: block;")
    }

    function hideLoader() {
        injectStyles("submit", "")
        injectStyles("loader", "")
    }

    function handleIntersections() {
        raycaster.setFromCamera(mouse, camera);

        var intersects = raycaster.intersectObjects(scene.children);

        if (intersects.length > 0) {
            if (INTERSECTED != intersects[0].object) {
                if (INTERSECTED)
                    INTERSECTED.material.emissive.setHex(
                        INTERSECTED.currentHex
                    );

                INTERSECTED = intersects[0].object;
                INTERSECTED.currentHex = INTERSECTED.material.emissive.getHex();
                INTERSECTED.material.emissive.setHex(0xff0000);

                handleContributionHover(INTERSECTED.material.contributionData);
            }
        } else {
            if (INTERSECTED)
                INTERSECTED.material.emissive.setHex(INTERSECTED.currentHex);

            handleContributionUnHover();

            INTERSECTED = null;
        }
    }

    function handleUserInput() {
        document
            .getElementById("submit")
            .addEventListener("click", function (event) {
                event.preventDefault();

                var inputField = document.getElementById("usernameInput");
                var inputValue = inputField.value;

                if (inputValue.length > 1) {
                    fetchUserData(inputValue.trim());
                } else {
                    inputField.focus();
                }
            });

        document.getElementById("usernameInput").addEventListener("keydown", function (event) {
            if (event.keyCode === 13) {
                event.preventDefault();

                var inputField = document.getElementById("usernameInput");
                var inputValue = inputField.value;

                if (inputValue.length > 1) {
                    fetchUserData(inputValue.trim());
                } else {
                    inputField.focus();
                }
            }
        })
    }

    function init(contributions) {
        initRenderer();
        initCamera();
        initScene();
        initCanvas();
        addContributionCubes(contributions);
        initEventListeners();
        animate();
    }

    handleUserInput();
})();