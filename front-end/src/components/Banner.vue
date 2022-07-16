<template>
    <div class="outer">
        <div class="inner">
            <img class="text" src="https://comserv.cs.ut.ee/img/TY_est.gif" />
            <img class="inner" src="https://comserv.cs.ut.ee/img/ty_head_1100.png" />
        </div>
    </div>
</template>
<script></script>
<style scoped>
.outer {
    display: flex;
    justify-content: center;
    margin-bottom: 6vh;
    margin-top: 2vh;
}

.inner {
    position: relative
}

.text {
    position: absolute;
    left: 1%;
    z-index: 1
}
</style>
