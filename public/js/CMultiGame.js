function CMultiGame() {
    var _bUpdate = false;
    var _bSuitAssigned;
    var _iCurTurn;                //Current Turn in game 
    var _iWinStreak;
    var _aSuitePlayer;

    var _oScenario;
    var _oGameOverPanel;
    var _oPlayer1;
    var _oPlayer2;
    var _oScoreGUI;
    var _oInterface;
    var _oMultiTable;
    var _oContainerGame;
    var _oContainerTable;
    var _oContainerInterface;
    var _iScore;
    var _oPriceBoard;

    var _oInteractiveHelp;

    var _oContainerInputController;
    var _oInputController;
    var _oShotPowerBar;
    var _oContainerShotPowerBar;
    var _oCointainerShotPowerBarInput;
    var _bHoldStickCommand;
    var _iDirStickCommand;
    var _iDirStickSpeedCommand;

    var _iOffset;


    this._init = async function () {
        console.log("creator:", s_oState.creator)
        console.log("me:", s_sSessionId)
        _iCurTurn = 1;
        s_oState.listen("stickAngle", async (currentValue, previousValue) => {
            isMyTurn = this.isMyTurn();
            if (!isMyTurn) {
                // s_oMultiTable._fPrevStickAngle = parseFloat(currentValue);
                console.log("delta angle", parseFloat(previousValue) - parseFloat(currentValue))
                s_oMultiTable.rotateStick(parseFloat(previousValue) - parseFloat(currentValue));
            }
        })
        s_oState.listen("mouseClickState", async (currentValue, previousValue) => {
            var isMyTurn = this.isMyTurn();
            if (!isMyTurn) {
                if (currentValue == "down") s_oMultiTable.startToShot();
                else if (currentValue == "press_move") {
                    s_oMultiTable.holdShotStickMovement(_iOffset);
                }
                else if (currentValue == "press_up") {
                    if (s_oMultiTable.startStickAnimation()) {
                        _oShotPowerBar.setInput(false);
                        // _oShotPowerBar.setInput(true);
                    }
                }
            }
        })
        s_oState.listen("currentTurn", async (sessionId) => {
            console.log("server player turned into", sessionId)
            s_sCurrentSessionId = sessionId
            // go to next turn after a little delay, to ensure "onJoin" gets called before this.
            // setTimeout(() => this.nextTurn(sessionId), 10);
            if (_iCurTurn === 1) {
                _iCurTurn = 2;

                if (!s_oMultiTable.isCpuTurn()) {
                    this.showShotBar();
                }

                _oPlayer2.highlight();
                _oPlayer1.unlight();
            } else {
                _iCurTurn = 1;
                _oPlayer1.highlight();
                _oPlayer2.unlight();
                this.showShotBar();
            }
            s_oInterface.resetSpin();

            // if (bFault) {
            //     new CEffectText(TEXT_FAULT, s_oStageUpper3D);
            // } else {
            //     new CEffectText(TEXT_CHANGE_TURN, s_oStageUpper3D);
            // }
            var isMyTurn = this.isMyTurn();
            console.log("isMyTurn in multigame init", isMyTurn)
            if (!isMyTurn) {
                window.document.getElementById('disable_panel').style.display = 'block';
            }
            else {
                window.document.getElementById('disable_panel').style.display = 'none';
            }
        });
        _iWinStreak = 0;
        _bSuitAssigned = false;
        _bHoldStickCommand = false;
        _iDirStickCommand = 1;
        _iDirStickSpeedCommand = COMMAND_STICK_START_SPEED;

        _iScore = 0;

        switch (s_iGameMode) {
            case GAME_MODE_NINE: {
                BALL_NUMBER = 9;
                break;
            }
            case GAME_MODE_EIGHT: {
                BALL_NUMBER = 15;
                break;
            }
            case GAME_MODE_TIME: {
                BALL_NUMBER = 15;
                break;
            }
        }

        RACK_POS = STARTING_RACK_POS[s_iGameMode];

        //Environment structure
        _oContainerGame = new createjs.Container();
        s_oStage.addChild(_oContainerGame);

        var oBg = createBitmap(s_oSpriteLibrary.getSprite("bg_game"));
        _oContainerGame.addChild(oBg);

        _oContainerTable = new createjs.Container();
        _oContainerGame.addChild(_oContainerTable);

        _oContainerInterface = new createjs.Container();
        s_oStage.addChild(_oContainerInterface);

        _oInterface = new CInterface(_oContainerInterface);
        _oScenario = new CScene();

        _oMultiTable = new CMultiTable(_oContainerTable, GAME_DIFFICULTY_PARAMS[s_iGameDifficulty]);//give game difficulty
        _oMultiTable.addEventListener(ON_LOST, this.gameOver, this);
        _oMultiTable.addEventListener(ON_WON, this.showWinPanel, this);

        var iY = 40;

        _oScoreGUI = null;


        //This is multiplay environment structuring part.
        if (s_iPlayerMode === GAME_MODE_MULTI) {
            //if multi, no need help.
            s_bInteractiveHelp = false;

            var oSpritePlayer1_NFT = s_oSpriteLibrary.getSprite("player1_nft");
            _oPlayer1_NFT = createBitmap(oSpritePlayer1_NFT);
            _oPlayer1_NFT.x = CANVAS_WIDTH / 2 - 225;
            _oPlayer1_NFT.y = 90;
            s_oStage.addChild(_oPlayer1_NFT);

            var oSpritePlayer2_NFT = s_oSpriteLibrary.getSprite("player2_nft");
            _oPlayer2_NFT = createBitmap(oSpritePlayer2_NFT);
            _oPlayer2_NFT.x = CANVAS_WIDTH / 2 + 180;
            _oPlayer2_NFT.y = 90;
            s_oStage.addChild(_oPlayer2_NFT);
            _oPriceBoard = new CPriceBoard(CANVAS_WIDTH / 2 - 30, 90, "1", s_oStage);
        }

        _oPlayer1 = new CPlayerGUI(CANVAS_WIDTH / 2 - 400, iY, TEXT_PLAYER1, s_oStage);
        _oPlayer2 = new CPlayerGUI(CANVAS_WIDTH / 2 + 400, iY, TEXT_PLAYER2, s_oStage);

        if (s_iPlayerMode === GAME_MODE_CPU) {
            _oScoreGUI = new CScoreGUI(CANVAS_WIDTH / 2, iY, s_oStage);
        }

        if (_iCurTurn === 1) {
            _oPlayer1.highlight();
            _oPlayer2.unlight();
        } else {
            console.log("_iCurturn", _iCurTurn)
            _oPlayer2.highlight();
            _oPlayer1.unlight();
        }

        if (s_iGameMode === GAME_MODE_NINE) {
            this.setNextBallToHit(1);
        }

        _oContainerInputController = new createjs.Container();
        s_oStage.addChild(_oContainerInputController);

        _oInputController = new CInputController(_oContainerInputController);
        _oInputController.addEventListener(ON_PRESS_DOWN_BUT_ARROW_LEFT, this._onPressDownStickCommand, this, -1);
        _oInputController.addEventListener(ON_PRESS_UP_BUT_ARROW_LEFT, this._onPressUpStickCommand, this);

        _oInputController.addEventListener(ON_PRESS_DOWN_BUT_ARROW_RIGHT, this._onPressDownStickCommand, this, 1);
        _oInputController.addEventListener(ON_PRESS_UP_BUT_ARROW_RIGHT, this._onPressUpStickCommand, this);

        _oContainerShotPowerBar = new createjs.Container();
        s_oStageUpper3D.addChild(_oContainerShotPowerBar);

        _oCointainerShotPowerBarInput = new createjs.Container();
        s_oStage.addChild(_oCointainerShotPowerBarInput);

        if (s_bMobile) {
            _oShotPowerBar = new CShotPowerBar(_oContainerShotPowerBar, 123, 260, _oCointainerShotPowerBarInput);

            //_oShotPowerBar.hide(0);
        }

        var oFade = new createjs.Shape();
        oFade.graphics.beginFill("black").drawRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        s_oStageUpper3D.addChild(oFade);

        tweenVolume("soundtrack", SOUNDTRACK_VOLUME_IN_GAME, 1000);

        _oGameOverPanel = new CGameOverPanel(s_oStageUpper3D);
        _oGameOverPanel.addEventListener(ON_EXIT_GAME, this.onExit, this);
        _oGameOverPanel.addEventListener(ON_RESTART, this.restartGame, this);

        //this.gameOver(sprintf(TEXT_PLAYER_NAME_WON, this.getPlayer2Name()), 9999);

        _oInteractiveHelp = null;
        if (s_bInteractiveHelp) {
            _oInteractiveHelp = new CInteractiveHelp(s_oStageUpper3D);
            _oInteractiveHelp.addEventListener(ON_END_TUTORIAL, this._onEndTutorial, this);
            $("#canvas_upper_3d").css("pointer-events", "initial");
            s_bInteractiveHelp = false;
        } else {
            this._onEndTutorial();
        }

        createjs.Tween.get(oFade)
            .to({ alpha: 0 }, 1000, createjs.Ease.cubicIn)
            .call(function () {
                s_oStageUpper3D.removeChild(oFade);
                this._startInteractiveHelp();
            });

        this.refreshButtonPos();

        sizeHandler();
        createjs.Tween.get(_oScenario).wait(s_iTimeElaps).call(_oScenario.update, null, _oScenario);
        var isMyTurn = this.isMyTurn();
        console.log("isMyTurn in multigame init", isMyTurn)
        if (!isMyTurn) window.document.getElementById('disable_panel').style.display = 'block';
        else window.document.getElementById('disable_panel').style.display = 'none';
    };

    this._startInteractiveHelp = function () {
        if (!_oInteractiveHelp) {
            return;
        }

        if (s_bMobile) {
            _oInteractiveHelp.startTutorial({
                tutorial: TUTORIAL_MOVE_STICK_MOBILE,
                info: {
                    movement: false,
                    on_show_tutorial: undefined
                }
            });
            _oInteractiveHelp.startTutorial({
                tutorial: TUTORIAL_SHOT_MOBILE,
                info: {
                    movement: false,
                    on_show_tutorial: undefined,
                    param: _oShotPowerBar
                }
            });
            _oInteractiveHelp.startTutorial({
                tutorial: TUTORIAL_MOVE_STICK_BUTTONS,
                info: {
                    movement: false,
                    on_show_tutorial: undefined
                }
            });
        } else {
            _oInteractiveHelp.startTutorial({
                tutorial: TUTORIAL_SHOT_DESKTOP,
                info: {
                    movement: false,
                    on_show_tutorial: undefined,
                    param: _oShotPowerBar
                }
            });
        }

        _oInteractiveHelp.startTutorial({
            tutorial: TUTORIAL_CUE_EFFECT,
            info: {
                movement: false,
                on_show_tutorial: undefined
            }
        });

        _oInteractiveHelp.startTutorial({
            tutorial: TUTORIAL_RESPOT_CUE,
            info: {
                movement: false,
                on_show_tutorial: undefined
            }
        });
    };

    this._onMouseDownPowerBar = function () {
        console.log("_onPressDownStickCommand")
        var isMyTurn = this.isMyTurn();
        console.log("isMyTurn in multigame _onMouseDownPowerBar", isMyTurn)
        if (isMyTurn) {
            s_oRoom.send("change_mouse_click", "down");
            s_oMultiTable.startToShot();
        }
    };

    this._onPressMovePowerBar = function (iOffset) {
        console.log("_onPressMovePowerBar")
        var isMyTurn = this.isMyTurn();
        console.log("isMyTurn in multigame _onPressMovePowerBar", isMyTurn)
        if (isMyTurn) {
            s_oRoom.send("change_mouse_click", "press_move");
            console.log("change_mouse_click in press_move")
            _iOffset = iOffset;
            s_oMultiTable.holdShotStickMovement(iOffset);
        }
    };

    this._onPressUpPowerBar = function () {
        console.log("_onPressUpPowerBar")
        var isMyTurn = this.isMyTurn();
        console.log("isMyTurn in multigame _onPressUpPowerBar", isMyTurn)
        if (isMyTurn) s_oRoom.send("change_mouse_click", "press_up");
        if (s_oMultiTable.startStickAnimation()) {
            _oShotPowerBar.setInput(false);
            // _oShotPowerBar.setInput(true);
        }
    };

    this.hideShotBar = function () {
        if (s_bMobile) {
            _oShotPowerBar.hide();
        }
    };

    this.showShotBar = function () {
        if (s_bMobile) {
            _oShotPowerBar.show();
        }
    };

    this._onEndTutorial = function () {
        $("#canvas_upper_3d").css("pointer-events", "none");
        _bUpdate = true;

        if (s_bMobile) {
            _oShotPowerBar.initEventListener();
            _oShotPowerBar.addEventListener(ON_MOUSE_DOWN_POWER_BAR, this._onMouseDownPowerBar, this);
            _oShotPowerBar.addEventListener(ON_PRESS_MOVE_POWER_BAR, this._onPressMovePowerBar, this);
            _oShotPowerBar.addEventListener(ON_PRESS_UP_POWER_BAR, this._onPressUpPowerBar, this);
            _oShotPowerBar.show();

        }

        if (_oInteractiveHelp) {
            _oInteractiveHelp.unload();
            _oInteractiveHelp = null;
        }
    };

    this._onPressDownStickCommand = function (iDir) {
        console.log("_onPressDownStickCommand")
        var isMyTurn = this.isMyTurn();
        console.log("isMyTurn in multigame _onPressDownStickCommand", isMyTurn)
        if (isMyTurn) {
            _iDirStickCommand = iDir;
            _bHoldStickCommand = true;
            _iDirStickSpeedCommand = COMMAND_STICK_START_SPEED;
        }
    };

    this._onPressUpStickCommand = function () {
        console.log("_onPressUpStickCommand")
        var isMyTurn = this.isMyTurn();
        console.log("isMyTurn in multigame _onPressUpStickCommand", isMyTurn)
        if (isMyTurn) _bHoldStickCommand = false;
    };

    this.unload = function (oCbCompleted = null, oCbScope) {
        _bUpdate = false;

        var oFade = new createjs.Shape();
        oFade.graphics.beginFill("black").drawRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        oFade.alpha = 0;
        s_oStageUpper3D.addChild(oFade);

        createjs.Tween.get(oFade)
            .to({ alpha: 1 }, 700, createjs.Ease.cubicIn)
            .call(function () {
                _oMultiTable.unload();
                _oInterface.unload();
                _oScenario.unload();
                _oGameOverPanel.unload();

                s_oStageUpper3D.removeAllChildren();
                s_oStage.removeAllChildren();

                if (oCbCompleted !== null) {
                    oCbCompleted.call(oCbScope);
                }
            });
    };

    this.reset = function () {
        _iCurTurn = 1;
        _bSuitAssigned = false;
    };

    this.refreshButtonPos = function () {
        _oInterface.refreshButtonPos();
        _oPlayer1.refreshButtonPos();
        _oPlayer2.refreshButtonPos();
        _oInputController.refreshOffsetPos();

        _oCointainerShotPowerBarInput.x = _oContainerShotPowerBar.x = s_iOffsetX * 0.5;

        if (_oInteractiveHelp) {
            _oInteractiveHelp.refreshButtonsPos();
        }
        if (_oScoreGUI) {
            _oScoreGUI.refreshButtonPos();
        }
    };

    //set the lowest ball currently on the table in the player interface
    this.setNextBallToHit = function (iNextBall) {
        if (_iCurTurn === 1) {
            _oPlayer2.setBallVisible(false);
            _oPlayer1.setBall(iNextBall);
        } else {
            _oPlayer1.setBallVisible(false);
            _oPlayer2.setBall(iNextBall);
        }
    };

    //change player turn
    this.changeTurn = function (bFault) {
        s_oRoom.send(("change_turn"))
        console.log("change_turn")

        // if (_iCurTurn === 1) {
        //     _iCurTurn = 2;

        //     if (!s_oMultiTable.isCpuTurn()) {
        //         this.showShotBar();
        //     }

        //     _oPlayer2.highlight();
        //     _oPlayer1.unlight();
        // } else {
        //     _iCurTurn = 1;
        //     _oPlayer1.highlight();
        //     _oPlayer2.unlight();
        //     this.showShotBar();
        // }
        // s_oInterface.resetSpin();

        if (bFault) {
            new CEffectText(TEXT_FAULT, s_oStageUpper3D);
        } else {
            new CEffectText(TEXT_CHANGE_TURN, s_oStageUpper3D);
        }
    };

    this.assignSuits = function (iBallNumber) {
        _aSuitePlayer = new Array();
        if (iBallNumber < 8) {
            if (_iCurTurn === 1) {
                _aSuitePlayer[0] = "solid";
                _aSuitePlayer[1] = "stripes";
                this.setBallInInterface("solid");
            } else {
                _aSuitePlayer[0] = "stripes";
                _aSuitePlayer[1] = "solid";
                this.setBallInInterface("stripes",);
            }
        } else {
            if (_iCurTurn === 1) {
                _aSuitePlayer[0] = "stripes";
                _aSuitePlayer[1] = "solid";
                this.setBallInInterface("stripes");
            } else {
                _aSuitePlayer[0] = "solid";
                _aSuitePlayer[1] = "stripes";
                this.setBallInInterface("solid");
            }
        }
        _bSuitAssigned = true;
    };

    this.setBallInInterface = function (szSuites1) {
        if (szSuites1 == "solid") {
            _oPlayer1.setBall(2);
            _oPlayer2.setBall(15);
        } else {
            _oPlayer1.setBall(15);
            _oPlayer2.setBall(2);
        }
    };

    this.isLegalShotFor8Ball = function (iBall, iNumBallToPot) {
        if (_bSuitAssigned) {
            if ((_aSuitePlayer[_iCurTurn - 1] == "solid") && (iBall < 8)) {
                return true;
            } else {
                if ((_aSuitePlayer[_iCurTurn - 1] == "stripes") && (iBall > 8)) {
                    return true;
                } else if ((iBall == 8) && (iNumBallToPot == 0)) {
                    return true;
                } else {
                    return false;
                }
            }
        } else {
            if (iBall != 8) {
                return true;
            } else {
                return false;
            }
        }
    };

    this.increaseWinStreak = function () {
        _iWinStreak++;
        //oWinStreak.text = "Win Streak: "+CAppBiliardo.m_iWinStreak;
    };

    this.resetWinStreak = function () {
        _iWinStreak = 0;
        //oWinStreak.text = "Win Streak: "+_iWinStreak;
    };

    this.gameOver = function (szText) {
        _oGameOverPanel.show(szText);
        $("#canvas_upper_3d").css("pointer-events", "initial");
        _bUpdate = false;
    };

    this.showWinPanel = function (szText) {
        var iScore = s_iGameMode === GAME_MODE_CPU ? _iScore : undefined;

        _oGameOverPanel.show(szText, iScore);
        $("#canvas_upper_3d").css("pointer-events", "initial");
        _bUpdate = false;
    };

    this.onExit = function () {
        _oScenario.update();
        tweenVolume("soundtrack", SOUNDTRACK_VOLUME_DEFAULT, 1000);
        this.unload(s_oMain.gotoMenu, s_oMain);

        $(s_oMain).trigger("show_interlevel_ad");
        $(s_oMain).trigger("end_session");
    };

    this.restartGame = function () {
        _oScenario.update();
        this.unload(s_oMain.gotoMultiGame, s_oMain);

        $(s_oMain).trigger("show_interlevel_ad");
        $(s_oMain).trigger("end_session");
    };

    this.updateScore = function (iVal) {
        if (!_oScoreGUI) {
            return;
        }

        var iNewScore = _iScore + iVal;

        _iScore = iNewScore < 0 ? 0 : iNewScore;

        _oScoreGUI.refreshScore(_iScore);
        _oScoreGUI.highlight();
    };

    this.getCurTurn = function () {
        return _iCurTurn;
    };

    this.getNextTurn = function () {
        return _iCurTurn === 1 ? 2 : 1;
    };

    this.getSuiteForCurPlayer = function () {
        return _aSuitePlayer[_iCurTurn - 1];
    };

    this.isSuiteAssigned = function () {
        return _bSuitAssigned;
    };

    this.getPlayer1Name = function () {
        return _oPlayer1.getPlayerName();
    };

    this.getPlayer2Name = function () {
        return _oPlayer2.getPlayerName();
    };

    this.isMyTurn = async function () {
        if (s_oRoom.sessionId == s_oState.currentTurn) {
            // console.log("me", s_oRoom.sessionId)
            // console.log("s_oState.currentTurn", s_oState.currentTurn)
            // console.log("My Turn");
            return true;
        } else {
            // console.log("me", s_oRoom.sessionId)
            // console.log("s_oState.currentTurn", s_oState.currentTurn)
            // console.log("Not my turn");
            return false;
        }
    }

    this._updateInput = function () {
        if (!_bHoldStickCommand) {
            return;
        }

        _oMultiTable.rotateStick(_iDirStickCommand * _iDirStickSpeedCommand);
        _iDirStickSpeedCommand += COMMAND_STICK_SPEED_INCREMENT;

        if (_iDirStickSpeedCommand >= COMMAND_STICK_MAX_SPEED) {
            _iDirStickSpeedCommand = COMMAND_STICK_MAX_SPEED;
        }
    };

    this.update = function () {
        //_oFpsText.refreshText(s_iCurFps+ " FPS")
        if (_bUpdate === false) {
            return;
        }
        var isMyTurn = this.isMyTurn();
        if (isMyTurn) { this._updateInput(); }


        _oMultiTable.update();
        _oScenario.update();
    };

    s_oMultiGame = this;


    this._init();
}
var s_oMultiGame = null;
