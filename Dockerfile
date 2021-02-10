# Builder image
FROM registry.access.redhat.com/ubi8/nodejs-14 as builder
COPY . .
RUN npm install && npm run build

# Runner image
FROM registry.access.redhat.com/ubi8/nodejs-14

LABEL name="gildub/opal" \
      description="On-Premise analytic tool for MTV" \
      help="For more information visit https://konveyor.io" \
      license="Apache License 2.0" \
      maintainer="gdubreui@redhat.com" \
      summary="On-Premise analytic tool for MTV" \
      url="https://quay.io/repository/konveyor/opal" \
      usage="podman run --rm -it -p 9002 -v /etc/opal/meta.json:/etc/opal/meta.json gildub/opal:latest" \
      com.redhat.component="konveyor-opal-container" \
      io.k8s.display-name="Opal" \
      io.k8s.description="On-Premise analytic tool for MTV" \
      io.openshift.expose-services="9002:http" \
      io.openshift.tags="operator,konveyor,ui,nodejs14" \
      io.openshift.min-cpu="100m" \
      io.openshift.min-memory="350Mi"

COPY --from=builder /opt/app-root/src/dist /opt/app-root/src/dist
COPY --from=builder /opt/app-root/src/node_modules /opt/app-root/src/node_modules
COPY --from=builder /opt/app-root/src/package.json /opt/app-root/src

ENV META_FILE="/etc/opal/meta.json"

ENTRYPOINT ["npm", "run", "-d", "start"]
